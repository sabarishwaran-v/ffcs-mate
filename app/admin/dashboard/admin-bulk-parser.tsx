'use client';

import { useState, useRef } from "react";
import { UploadCloud, Loader2, Sparkles, CheckCircle2, FileCode, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { db, auth } from "@/lib/firebase";
import { doc, updateDoc, setDoc, collection, query, where, getDocs, writeBatch } from "firebase/firestore";
import { parseMockHtml, ParsedMockCourse } from "@/lib/mock-html-parser";

export default function AdminBulkParser() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedCourse, setParsedCourse] = useState<ParsedMockCourse | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.html') && !file.name.endsWith('.htm')) {
      toast.error('Please upload an HTML file (.html or .htm)');
      return;
    }

    setSelectedFile(file);
    setErrorMessage(null);
    setIsProcessing(true);

    try {
      const text = await file.text();
      const parsed = parseMockHtml(text);

      if (!parsed) {
        setErrorMessage('Could not extract course details. Ensure this is a VTOP Mock FFCS registration page HTML.');
        setParsedCourse(null);
      } else {
        setParsedCourse(parsed);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Failed to read HTML file.');
      setParsedCourse(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePublishLive = async () => {
    if (!parsedCourse) return;

    const allOfferings = [...parsedCourse.theoryOfferings, ...parsedCourse.labOfferings];
    if (allOfferings.length === 0) {
      toast.error('No offerings found to publish.');
      return;
    }

    if (!confirm(`Publish all ${allOfferings.length} slots for ${parsedCourse.courseCode} directly to all students?`)) {
      return;
    }

    setIsProcessing(true);
    try {
      const updates: Record<string, any> = {};

      allOfferings.forEach((offering) => {
        const cleanSlot = offering.slot.trim().toUpperCase();
        const cleanFac = offering.faculty.trim();
        const cleanVen = offering.venue.trim().toUpperCase();
        const docId = `${parsedCourse.courseCode}_${cleanSlot}_${cleanFac.replace(/[^a-zA-Z0-9]/g, '_')}`;

        updates[docId] = {
          id: docId,
          courseCode: parsedCourse.courseCode,
          courseTitle: parsedCourse.courseTitle,
          slot: cleanSlot,
          faculty: cleanFac,
          venue: cleanVen,
          approvedAt: new Date().toISOString(),
          approvedBy: auth.currentUser?.email || 'Admin',
        };
      });

      // 1. Update approved faculties bundle
      await setDoc(doc(db, 'system', 'approved_faculties_bundle'), updates, { merge: true });

      // 2. Clean up any pending submissions for this course
      try {
        const batch = writeBatch(db);
        const qPending = query(
          collection(db, 'pending_faculties'),
          where('courseCode', '==', parsedCourse.courseCode)
        );
        const pendingSnap = await getDocs(qPending);
        pendingSnap.forEach((docSnap) => batch.delete(docSnap.ref));

        const qSubmissions = query(
          collection(db, 'pending_submissions'),
          where('courseCode', '==', parsedCourse.courseCode)
        );
        const submissionsSnap = await getDocs(qSubmissions);
        submissionsSnap.forEach((docSnap) => batch.delete(docSnap.ref));

        await batch.commit();
      } catch (cleanErr) {
        console.warn('Non-fatal cleanup error:', cleanErr);
      }

      toast.success(
        `Successfully published ${allOfferings.length} slots for ${parsedCourse.courseCode} live to all students!`
      );

      // Reset
      setSelectedFile(null);
      setParsedCourse(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to publish to live bundle.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-card border rounded-2xl overflow-hidden shadow-sm p-6 mb-8 flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <FileCode className="w-5 h-5 text-purple-500" />
          Direct Mock FFCS HTML Importer
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Upload a student's Mock FFCS HTML file. It will be parsed instantly and can be published directly to all students.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="text-sm font-semibold mb-2 block">Upload Mock FFCS HTML File</label>
          <div
            onClick={() => !isProcessing && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
              selectedFile
                ? 'border-purple-500/50 bg-purple-500/5'
                : 'border-border hover:bg-secondary/50'
            } ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <UploadCloud className="w-8 h-8 text-muted-foreground mb-2" />
            <p className="text-sm font-medium">
              {selectedFile ? selectedFile.name : 'Click to select Mock HTML file (.html)'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Supports files saved via Ctrl+S from VTOP
            </p>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".html,.htm"
            className="hidden"
          />
        </div>

        <div>
          <label className="text-sm font-semibold mb-2 block">Extracted Overview</label>
          {errorMessage && (
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {parsedCourse && (
            <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-2">
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>{parsedCourse.courseCode}</span> - {parsedCourse.courseTitle}
              </div>
              <div className="text-xs text-muted-foreground flex gap-4">
                <span>Theory Slots: <strong>{parsedCourse.theoryOfferings.length}</strong></span>
                <span>Lab Slots: <strong>{parsedCourse.labOfferings.length}</strong></span>
                <span>Credits: <strong>{parsedCourse.credits}</strong></span>
              </div>
            </div>
          )}

          {!parsedCourse && !errorMessage && (
            <div className="p-8 rounded-xl border border-dashed text-center text-xs text-muted-foreground">
              Select an HTML file to see the extracted course details and faculty offerings.
            </div>
          )}
        </div>
      </div>

      {parsedCourse && (
        <div className="flex justify-end pt-4 border-t">
          <Button
            onClick={handlePublishLive}
            disabled={isProcessing}
            className="bg-purple-600 hover:bg-purple-700 text-white min-w-[160px] font-semibold"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            Publish Live to All Students
          </Button>
        </div>
      )}
    </div>
  );
}
