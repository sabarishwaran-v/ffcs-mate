'use client';

import { useState } from 'react';
import { Course, Teacher } from '@/types';
import { AnimatedButton } from '@/components/ui/button';
import { X, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { db, auth } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { toast } from 'sonner';

interface FacultyContributeModalProps {
  course: Course;
  teacherSlot: Teacher;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newFaculty: string, newVenue: string) => void;
}

export default function FacultyContributeModal({ course, teacherSlot, isOpen, onClose, onSuccess }: FacultyContributeModalProps) {
  const [pasteData, setPasteData] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!pasteData.trim()) {
      toast.error('Please paste the VTOP data');
      return;
    }

    setLoading(true);
    try {
      // Basic extraction logic: 
      // VTOP row typically looks like: CSE1001 ... Software Engineering ... L1+L2 ... VENKATESH ... CB 101
      // For this demo, let's just do a simple line split or allow manual entry if regex fails.
      // We will parse it broadly. 
      const parsedFaculty = pasteData.match(/([A-Z\s]+(?:\s[A-Z]+)*)/)?.[1] || pasteData.trim();
      const parsedVenue = pasteData.match(/(CB|AB\d|SJT|SMV)\s*-?\s*\d{3}/i)?.[0] || 'TBA';
      
      const docId = `${course.code}_${teacherSlot.name}_${parsedFaculty.replace(/\s+/g, '')}`;
      
      await setDoc(doc(db, 'pending_faculties', docId), {
        courseCode: course.code,
        courseTitle: course.title,
        slot: teacherSlot.name,
        faculty: parsedFaculty,
        venue: parsedVenue,
        rawPaste: pasteData,
        submittedAt: new Date().toISOString(),
        submittedBy: auth.currentUser?.email || 'Anonymous'
      });

      toast.success('Successfully submitted! Your timetable has been updated locally.');
      onSuccess(parsedFaculty, parsedVenue);
      onClose();
    } catch (error: any) {
      toast.error('Error submitting data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl border flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-secondary/30">
          <div>
            <h2 className="text-xl font-bold">Add Missing Faculty & Venue</h2>
            <p className="text-sm text-muted-foreground mt-1">For {course.code} - Slot {teacherSlot.name}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-secondary/50 hover:bg-secondary rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Guide Side */}
          <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-blue-500/20 text-blue-600 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-semibold mb-2">How to do it?</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Go to VTOP Mock FFCS, highlight the row containing the faculty for this slot, copy it, and paste it here!
            </p>
            <div className="w-full aspect-video bg-black/10 rounded-lg flex items-center justify-center">
               <span className="text-xs text-muted-foreground">[Placeholder for Guide GIF]</span>
            </div>
          </div>

          {/* Input Side */}
          <div className="flex flex-col">
            <label className="text-sm font-semibold mb-2 flex justify-between">
              Paste VTOP Row Here
              <span className="text-xs text-muted-foreground font-normal bg-secondary px-2 py-0.5 rounded">Ctrl + V</span>
            </label>
            <textarea
              value={pasteData}
              onChange={(e) => setPasteData(e.target.value)}
              placeholder="e.g., CSE1022 ... Software Engineering ... L1+L2 ... DR. SMITH ... CB 101"
              className="flex-grow min-h-[150px] p-4 rounded-xl border bg-secondary/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none font-mono text-xs"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-secondary/10 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-500 text-xs">
            <AlertTriangle className="w-4 h-4" />
            Ensure course codes match!
          </div>
          <div className="flex gap-3">
            <AnimatedButton variant="outline" onClick={onClose}>Cancel</AnimatedButton>
            <AnimatedButton onClick={handleSubmit} disabled={loading || !pasteData} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Faculty'}
            </AnimatedButton>
          </div>
        </div>

      </div>
    </div>
  );
}
