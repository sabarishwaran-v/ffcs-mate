import { useState, useRef } from "react";
import { Course, Teacher } from "@/types";
import { useScheduleStore, useFacultyStore } from "@/lib/store";
import { toast } from "sonner";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ClipboardPaste, AlertTriangle, CheckCircle2, Loader2, Sparkles, UploadCloud, FileImage, X } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { collection, addDoc, setDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Tesseract from 'tesseract.js';

interface BulkFacultyParserModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course;
  availableTeachersTemplate: Teacher[];
}

export default function BulkFacultyParserModal({
  isOpen,
  onClose,
  course,
  availableTeachersTemplate
}: BulkFacultyParserModalProps) {
  const [pastedData, setPastedData] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Image Upload States
  const [images, setImages] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [ocrProgress, setOcrProgress] = useState<{status: string, progress: number} | null>(null);

  // Validation states
  const [parsedTeachers, setParsedTeachers] = useState<Teacher[]>([]);
  const [unrecognizedSlots, setUnrecognizedSlots] = useState<string[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [mismatchedCourseInfo, setMismatchedCourseInfo] = useState<string | null>(null);
  const [showHowTo, setShowHowTo] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState(false);

  const { addTeacher, removeTeacher, replaceCourseTeachers } = useScheduleStore();
  const { approvedFaculties } = useFacultyStore();
  const { user, userData } = useAuth();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      if (images.length + newFiles.length > 8) {
        toast.error("You can only upload a maximum of 8 images.");
        return;
      }
      setImages(prev => [...prev, ...newFiles]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const parseTextCore = (textToParse: string) => {
    const lines = textToParse.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    let foundCourseCodeMismatch = null;
    const newTeachers: Teacher[] = [];
    const unknownSlots: Set<string> = new Set();
    
    const validSlots = Array.from(new Set(availableTeachersTemplate.map(t => t.name)));

    for (const line of lines) {
      if (line.toUpperCase().includes(course.code.toUpperCase())) continue;
      
      const courseCodeMatch = line.match(/^[A-Z]{3}[0-9]{3,4}/i);
      if (courseCodeMatch && !line.toUpperCase().includes(course.code.toUpperCase())) {
        foundCourseCodeMismatch = line;
      }

      let columns = line.split('\t').map(c => c.trim()).filter(c => c.length > 0);
      
      // Fallback for OCR (which uses spaces instead of tabs)
      if (columns.length < 3) {
        // Extract venue - handles standard formats (e.g., CB-106) and online formats (e.g., ONL00214)
        const venueRegex = /\b([A-Z0-9]{2,4}-[A-Z0-9]{3,4}|ONL\d{3,6})\b/i;
        const venueMatch = line.match(venueRegex);
        const venue = venueMatch ? venueMatch[1] : "Unknown";

        const slotRegex = /^([A-Z0-9\+]+)\s+/i;
        const slotMatchPattern = line.match(slotRegex);
        let extractedSlot: string | null | undefined = slotMatchPattern ? slotMatchPattern[1] : null;

        if (!extractedSlot) {
            extractedSlot = validSlots.find(s => line.includes(s));
        }

        if (extractedSlot) {
           let slotMatch = validSlots.find(s => extractedSlot.includes(s) || s.includes(extractedSlot));
           
           if (slotMatch) {
             let faculty = line.replace(extractedSlot, '');
             if (venue !== "Unknown") faculty = faculty.replace(venue, '');
             
             // Aggressively truncate from the Availability column onward
             // Matches " O 65 ...", " 0 69 ...", " 0 e8 ...", " Available ...", " Full ..."
             faculty = faculty.replace(/\s+(?:[O0F]\s*[0-9eE]+|Available|Full|Waiting).*$/i, '');
             
             // Strip any trailing non-alphabet characters or weird small garbage words (like "ER", "Im", "__", "()")
             faculty = faculty.replace(/\s+(?:ER|Im|__|\(\)|:.*)$/i, '');
             
             // Strip trailing punctuation and non-alphanumeric
             faculty = faculty.replace(/[^a-zA-Z0-9]+$/, ''); 
             
             // Strip leading punctuation
             faculty = faculty.replace(/^[^a-zA-Z]+/, ''); 
             
             faculty = faculty.trim().replace(/\s+/g, ' ');
             
             if (faculty.length > 0) {
               columns = [slotMatch, venue, faculty];
             }
           }
        }
      }
      
      if (columns.length >= 3) {
        let slot = columns[0];
        let venue = columns[1];
        let faculty = columns[2];
        
        const template = availableTeachersTemplate.find(t => t.name === slot);
        
        if (template) {
          const newTeacher: Teacher = {
            ...template,
            id: `${course.id}-${slot}-${Math.random().toString(36).slice(2, 9)}`,
            faculty: faculty,
            venue: {
              morning: template.slots.morning ? venue : null,
              afternoon: template.slots.afternoon ? venue : null,
            },
            addedByUid: user?.uid,
            addedByName: userData?.name || 'Anonymous Student'
          };
          
          if (!newTeachers.some(t => t.name === slot && t.faculty === faculty)) {
            newTeachers.push(newTeacher);
          }
        } else if (slot.includes('+') || slot.match(/^[A-Z][1-2]$/)) {
          unknownSlots.add(slot);
        }
      }
    }

    setUnrecognizedSlots(Array.from(unknownSlots));
    
    if (foundCourseCodeMismatch) {
      setMismatchedCourseInfo(foundCourseCodeMismatch);
      setParsedTeachers(newTeachers);
      setShowConfirmation(true);
    } else if (newTeachers.length === 0) {
      toast.error("Could not find any valid slots for this course. Make sure the table/images are clear.");
    } else {
      setParsedTeachers(newTeachers);
    }
  };

  const handleParse = async () => {
    if (!pastedData.trim() && images.length === 0) {
      toast.error("Please paste data or upload images first.");
      return;
    }

    setIsParsing(true);
    setParsedTeachers([]);
    setUnrecognizedSlots([]);
    setMismatchedCourseInfo(null);
    setShowConfirmation(false);
    setOcrProgress(null);

    try {
      let combinedText = pastedData;

      if (images.length > 0) {
        toast.info("Extracting text from images... this may take a moment.");
        for (let i = 0; i < images.length; i++) {
          setOcrProgress({ status: `Scanning image ${i + 1} of ${images.length}...`, progress: 0 });
          const result = await Tesseract.recognize(images[i], 'eng', {
            logger: m => {
              if (m.status === 'recognizing text') {
                setOcrProgress({ status: `Scanning image ${i + 1} of ${images.length}...`, progress: m.progress });
              }
            }
          });
          combinedText += '\n' + result.data.text;
        }
        setOcrProgress(null);
      }
      
      // Give UI time to update
      setTimeout(() => {
        try {
          parseTextCore(combinedText);
        } catch(e) {
          console.error(e);
          toast.error("Failed parsing text.");
        } finally {
          setIsParsing(false);
        }
      }, 100);
      
    } catch (error) {
      console.error(error);
      toast.error("An error occurred during OCR or parsing.");
      setIsParsing(false);
    }
  };

  const handleSave = async () => {
    if (parsedTeachers.length === 0) return;
    
    setIsSubmitting(true);
    
    try {
      const store = useScheduleStore.getState();
      const localCourseTeachers = store.teachers.filter(t => t.id.startsWith(course.id));
      
      const parsedSlotNames = new Set(parsedTeachers.map(t => t.name));
      const approvedSlotNames = new Set(
         localCourseTeachers
           .filter(t => {
              const deterministicId = `${course.code}_${t.name}_${(t.faculty || '').replace(/\\s+/g, '_')}`;
              return approvedFaculties[t.id] || approvedFaculties[deterministicId];
           })
           .map(t => t.name)
      );

      // Keep globally approved teachers
      const finalTeachersToKeep = localCourseTeachers.filter(t => {
        const deterministicId = `${course.code}_${t.name}_${(t.faculty || '').replace(/\\s+/g, '_')}`;
        return approvedFaculties[t.id] || approvedFaculties[deterministicId];
      });

      // Re-inject mock placeholders for slots that are empty
      availableTeachersTemplate.forEach(t => {
        if (!parsedSlotNames.has(t.name) && !approvedSlotNames.has(t.name)) {
           finalTeachersToKeep.push({ ...t, faculty: "-", id: `${course.id}-${t.name}-mock` });
        }
      });

      // Add the newly parsed faculties
      parsedTeachers.forEach(t => {
        finalTeachersToKeep.push(t);
      });
      
      // Perform ONE atomic update
      replaceCourseTeachers(course.id, finalTeachersToKeep);

      try {
        const batch = parsedTeachers.map(t => {
          const deterministicId = `${course.code}_${t.name}_${(t.faculty || '').replace(/\\s+/g, '_')}`;
          return {
            id: deterministicId,
            courseId: course.id,
            courseCode: course.code,
            courseName: course.name,
            slot: t.name,
            facultyName: t.faculty,
            venue: t.venue.morning || t.venue.afternoon || "Unknown",
            submittedByUid: user?.uid || 'anonymous',
            submittedByName: userData?.name || 'Anonymous',
            submittedAt: new Date().toISOString(), // Use local date for JSON
            status: 'approved' // Set to approved directly for local override
          };
        });
        
        // --- NEW LOCAL OVERRIDE DOWNLOAD ---
        // Instead of writing to Firebase (which is blocked by quota), download it directly!
        const jsonString = JSON.stringify(batch, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `parsed_${course.code}_faculties.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // We no longer push to pending_faculties
        // const promises = batch.map(...)
      } catch (err) {
        console.error("Failed to generate download file", err);
      }

      toast.success(`Successfully added ${parsedTeachers.length} classes for ${course.code}!`);
      setPastedData("");
      setImages([]);
      setParsedTeachers([]);
      onClose();
    } catch (error) {
      toast.error("Failed to save the parsed faculties.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl bg-card border-border/50">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Sparkles className="w-5 h-5 text-purple-500" />
              Bulk Add Faculties for {course.code}
            </DialogTitle>
            <Button 
              size="sm" 
              onClick={() => setShowHowTo(!showHowTo)}
              className="text-xs h-7 bg-blue-500 hover:bg-blue-600 text-white border-none shadow-md shadow-blue-500/20"
            >
              How to do ?
            </Button>
          </div>
          <DialogDescription>
            Upload screenshots of the Mock FFCS Faculty List of this course (max 8) and we will automatically extract the data!
          </DialogDescription>
        </DialogHeader>

        {showHowTo && (
          <div className="bg-muted/50 p-4 rounded-lg border border-border mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-bold mb-2">Watch Tutorial</h4>
              <div className="aspect-video bg-black/10 rounded-md overflow-hidden flex items-center justify-center border border-border relative">
                <video 
                  src="/tutorial-placeholder.mp4" 
                  controls
                  playsInline 
                  className="w-full h-full object-contain bg-black"
                />
              </div>
            </div>
            <div>
              <h4 className="text-sm font-bold mb-2">Example Screenshot</h4>
              <div 
                className="aspect-video bg-black/10 rounded-md overflow-hidden flex items-center justify-center border border-border relative cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setFullScreenImage(true)}
              >
                {/* User will replace this src with their actual example picture later */}
                <img 
                  src="/Discrete Maths pg 1.png" 
                  alt="Example VTOP format" 
                  className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                <span className="absolute text-muted-foreground text-xs font-bold uppercase tracking-wider -z-10">Image Placeholder</span>
              </div>
            </div>
          </div>
        )}

        {!parsedTeachers.length && !showConfirmation ? (
          <div className="space-y-4 mt-2">
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase flex justify-between">
                <span>Upload Screenshots</span>
                <span className="text-primary">{images.length}/8</span>
              </label>
                <div 
                  className={`h-[180px] border-2 border-dashed rounded-md flex flex-col items-center justify-center p-4 transition-colors ${images.length > 0 ? 'border-primary/50 bg-primary/5' : 'border-border bg-background'}`}
                >
                  {images.length === 0 ? (
                    <div className="text-center">
                      <UploadCloud className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground mb-4">Drag & Drop or Click to upload</p>
                      <Button onClick={() => fileInputRef.current?.click()} variant="outline" size="sm" className="h-8 text-xs">
                        Select Images
                      </Button>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col">
                      <div className="flex-1 overflow-y-auto w-full grid grid-cols-2 gap-2 pr-1">
                        {images.map((file, i) => (
                          <div key={i} className="relative group bg-background border rounded overflow-hidden flex items-center h-12 px-2">
                            <FileImage className="w-4 h-4 text-primary shrink-0 mr-2" />
                            <span className="text-[10px] truncate">{file.name}</span>
                            <button 
                              onClick={() => removeImage(i)}
                              className="absolute right-1 top-1/2 -translate-y-1/2 bg-red-500/10 text-red-500 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="pt-2 flex justify-between items-center shrink-0">
                        <Button 
                          onClick={() => fileInputRef.current?.click()} 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 text-xs text-primary"
                          disabled={images.length >= 8}
                        >
                          + Add More
                        </Button>
                        <Button onClick={() => setImages([])} variant="ghost" size="sm" className="h-7 text-xs text-red-500">
                          Clear All
                        </Button>
                      </div>
                    </div>
                  )}
                  <input 
                    type="file" 
                    multiple 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />
                </div>
              </div>
            {ocrProgress && (
              <div className="bg-primary/10 border border-primary/20 rounded-md p-3">
                <div className="flex justify-between items-center text-xs font-bold text-primary mb-2">
                  <span>{ocrProgress.status}</span>
                  <span>{Math.round(ocrProgress.progress * 100)}%</span>
                </div>
                <div className="w-full bg-background rounded-full h-2 overflow-hidden">
                  <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${ocrProgress.progress * 100}%` }}></div>
                </div>
              </div>
            )}
            
            <DialogFooter className="mt-4">
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button 
                onClick={handleParse} 
                disabled={images.length === 0 || isParsing}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {isParsing ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2" /> Extract & Parse</>
                )}
              </Button>
            </DialogFooter>
          </div>
        ) : showConfirmation ? (
          <div className="space-y-6 mt-4">
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-5 flex gap-4 items-start">
              <AlertTriangle className="w-6 h-6 text-yellow-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-yellow-600 dark:text-yellow-500 font-bold mb-1">Course Mismatch Warning</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  We noticed the data you provided contains information for a different course:<br/>
                  <code className="bg-yellow-500/20 px-1.5 py-0.5 rounded text-yellow-700 dark:text-yellow-400 mt-2 inline-block">
                    {mismatchedCourseInfo}
                  </code>
                </p>
                <p className="text-sm font-medium text-foreground">
                  Are you absolutely sure you want to add these faculties to <strong>{course.code}</strong>?
                </p>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConfirmation(false)}>
                No, Let me try again
              </Button>
              <Button 
                onClick={() => {
                  setShowConfirmation(false);
                  if (parsedTeachers.length === 0) {
                    toast.error("No valid slots found after confirming.");
                  }
                }}
                className="bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                Yes, This is for {course.code}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
              <div>
                <h4 className="text-emerald-700 dark:text-emerald-400 font-bold">Successfully Parsed!</h4>
                <p className="text-sm text-muted-foreground">Found {parsedTeachers.length} valid classes for this course.</p>
              </div>
            </div>

            {unrecognizedSlots.length > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-sm">
                <span className="font-bold text-amber-600 dark:text-amber-500">Warning:</span> Ignored {unrecognizedSlots.length} slots because they don't belong to {course.code}.
              </div>
            )}

            <div className="max-h-[250px] overflow-y-auto border border-border rounded-lg bg-background divide-y divide-border">
              <div className="grid grid-cols-[100px_1fr_100px] gap-2 p-3 bg-secondary/50 text-xs font-bold uppercase tracking-wider text-muted-foreground sticky top-0">
                <span>Slot</span>
                <span>Faculty</span>
                <span>Venue</span>
              </div>
              {parsedTeachers.map((t, i) => (
                <div key={i} className="grid grid-cols-[100px_1fr_100px] gap-2 p-3 text-sm items-center hover:bg-secondary/20 transition-colors">
                  <span className="font-semibold text-primary">{t.name}</span>
                  <span className="truncate">{t.faculty}</span>
                  <span className="text-muted-foreground truncate">{t.venue.morning || t.venue.afternoon || "-"}</span>
                </div>
              ))}
            </div>
            
            <DialogFooter>
              <Button variant="ghost" onClick={() => setParsedTeachers([])} disabled={isSubmitting}>
                Start Over
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                ) : (
                  <><CheckCircle2 className="w-4 h-4 mr-2" /> Save to Planner</>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>

      <Dialog open={fullScreenImage} onOpenChange={setFullScreenImage}>
        <DialogContent className="max-w-5xl w-[95vw] max-h-[95vh] p-2 bg-black/95 border-none flex flex-col items-center justify-center shadow-2xl">
          <DialogHeader className="hidden">
            <DialogTitle>Example Screenshot Full View</DialogTitle>
          </DialogHeader>
          <img 
            src="/Discrete Maths pg 1.png" 
            alt="Example VTOP format Full" 
            className="w-full h-full object-contain rounded-md"
          />
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-2 right-2 text-white/50 hover:text-white bg-black/20 hover:bg-black/50"
            onClick={() => setFullScreenImage(false)}
          >
            <X className="w-5 h-5" />
          </Button>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
