'use client';

import { useState, useRef } from "react";
import { createWorker } from "tesseract.js";
import { UploadCloud, Loader2, Play, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { db, auth } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { MOCK_COURSES } from "@/lib/mock-data";

export default function AdminBulkParser() {
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState<{ status: string; progress: number } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const course = MOCK_COURSES.find(c => c.id === selectedCourseId);
  const availableTeachersTemplate = [...(course?.theorySlots || []), ...(course?.labSlots || [])].map(slot => ({
    name: slot,
    slots: { morning: [slot], afternoon: [] }
  }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      if (selectedFiles.length > 8) {
        toast.error("Maximum 8 images allowed at once.");
        return;
      }
      setFiles(selectedFiles);
    }
  };

  const handleExtractAndParse = async () => {
    if (!course) {
      toast.error("Please select a course first");
      return;
    }
    
    if (files.length === 0) {
      toast.error("Please upload at least one image");
      return;
    }

    setIsProcessing(true);
    setOcrProgress({ status: 'Initializing OCR Engine...', progress: 0 });
    
    let combinedText = "";

    try {
      const worker = await createWorker('eng', 1, {
        logger: (m: any) => {
          if (m.status === 'recognizing text') {
            setOcrProgress({ status: `Extracting text...`, progress: m.progress });
          } else {
            setOcrProgress({ status: m.status, progress: 0 });
          }
        }
      });
      
      for (let i = 0; i < files.length; i++) {
        setOcrProgress({ status: `Processing image ${i + 1} of ${files.length}...`, progress: 0 });
        const { data: { text } } = await worker.recognize(files[i]);
        combinedText += text + "\n";
      }
      
      await worker.terminate();
      
      setOcrProgress({ status: 'Parsing extracted data...', progress: 100 });
      await processParsedText(combinedText);
      
    } catch (error) {
      console.error(error);
      toast.error("Failed to extract text from images.");
    } finally {
      setIsProcessing(false);
      setOcrProgress(null);
    }
  };

  const processParsedText = async (text: string) => {
    if (!course) return;
    
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    const updates: any[] = [];
    const validSlots = new Set(availableTeachersTemplate.map(t => t.name));

    for (const line of lines) {
      let columns = line.split('\t').filter(c => c.trim().length > 0);
      
      if (columns.length < 3) {
        const venueRegex = /\b([A-Z0-9]{2,4}-[A-Z0-9]{3,4}|ONL\d{3,6})\b/i;
        const venueMatch = line.match(venueRegex);
        const venue = venueMatch ? venueMatch[1] : "Unknown";

        // Match any valid VIT slot combination like L51+L52, C1+TC1+TCC1, A2+TA2, etc.
        const slotRegex = /\b([a-zA-Z]{1,3}[0-9]{1,2}(?:\+[a-zA-Z]{1,3}[0-9]{1,2}){0,5})\b/i;
        const slotMatchArray = line.match(slotRegex);
        const slotMatch = slotMatchArray ? slotMatchArray[1].toUpperCase() : null;
        
        let faculty = line;
        if (slotMatch) faculty = faculty.replace(slotMatchArray![0], '');
        if (venue !== "Unknown") faculty = faculty.replace(venue, '');
        
        faculty = faculty
          .replace(/^[0-9]+/, '')
          .replace(/\b(Theory Only|Embedded Theory|Embedded Lab|Soft Skill)\b/gi, '')
          .replace(/[^a-zA-Z\s.]/g, '')
          .trim();
        
        faculty = faculty.replace(/\s+/g, ' ');

        if (slotMatch && faculty.length > 3) {
          columns = [slotMatch, venue, faculty];
        } else {
          continue;
        }
      }

      let slotString = columns[0];
      let venue = columns[1];
      let faculty = columns[columns.length - 1];

      let matchingTemplate = availableTeachersTemplate.find(t => t.name === slotString || slotString.includes(t.name));
      if (!matchingTemplate) {
        // Try fixing common OCR mistakes in slot strings (e.g. 1 instead of L, S instead of 5)
        const fixedSlot = slotString.replace(/1/g, 'L').replace(/S/g, '5');
        matchingTemplate = availableTeachersTemplate.find(t => t.name === fixedSlot || fixedSlot.includes(t.name));
      }

      if (matchingTemplate && faculty && faculty.length > 3 && faculty !== "Unknown") {
        updates.push({
          template: matchingTemplate,
          venue,
          faculty: faculty.trim()
        });
      }
    }

    if (updates.length === 0) {
      toast.error("Could not find any valid faculty data matching this course's slots.");
      return;
    }

    setOcrProgress({ status: 'Pushing instantly to live database...', progress: 100 });
    
    const results = await Promise.allSettled(
      updates.map(update => {
        const deterministicId = `${course.code}_${update.template.name}_${update.faculty.replace(/\s+/g, '_')}`;
        
        const data = {
          courseId: course.id,
          courseCode: course.code,
          courseName: course.title,
          slot: update.template.name,
          facultyName: update.faculty,
          venue: update.venue,
          approvedBy: auth.currentUser?.email || 'admin',
          approvedAt: new Date().toISOString(),
          status: 'approved'
        };

        return setDoc(doc(db, 'approved_faculties', deterministicId), data, { merge: true });
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    toast.success(`Instantly published ${successful} slots directly to students!`);
    setFiles([]);
  };

  return (
    <div className="bg-card border rounded-2xl overflow-hidden shadow-sm p-6 mb-8 flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Play className="w-5 h-5 text-purple-500" />
          Direct-to-Live Bulk Parser
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Upload screenshots of VTOP faculty lists. They will be parsed and immediately pushed to all students without any approval needed.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="text-sm font-semibold mb-2 block">1. Select Course</label>
          <select 
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="w-full bg-secondary/50 border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">-- Choose Course --</option>
            {MOCK_COURSES.map(c => (
              <option key={c.id} value={c.id}>{c.code} - {c.title}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="text-sm font-semibold mb-2 block">2. Upload Screenshots (Max 8)</label>
          <div 
            onClick={() => !isProcessing && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
              files.length > 0 ? 'border-purple-500/50 bg-purple-500/5' : 'border-border hover:bg-secondary/50'
            } ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <UploadCloud className="w-8 h-8 text-muted-foreground mb-2" />
            <p className="text-sm font-medium">
              {files.length > 0 ? `${files.length} images selected` : 'Click to select screenshots'}
            </p>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            multiple 
            className="hidden" 
          />
        </div>
      </div>

      {ocrProgress && (
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
          <div className="flex justify-between items-center text-sm font-bold text-purple-600 mb-2">
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              {ocrProgress.status}
            </span>
            <span>{Math.round(ocrProgress.progress * 100)}%</span>
          </div>
          <div className="w-full bg-purple-200/50 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-purple-600 h-full transition-all duration-300"
              style={{ width: `${Math.max(5, ocrProgress.progress * 100)}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex justify-end pt-4 border-t">
        <Button 
          onClick={handleExtractAndParse}
          disabled={!selectedCourseId || files.length === 0 || isProcessing}
          className="bg-purple-600 hover:bg-purple-700 text-white min-w-[150px]"
        >
          {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Extract & Publish Live"}
        </Button>
      </div>
    </div>
  );
}
