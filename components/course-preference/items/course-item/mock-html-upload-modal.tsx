"use client";

import { useState, useRef } from "react";
import { Course, Teacher } from "@/types";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  CheckCircle2,
  FileCode,
  UploadCloud,
  X,
  AlertCircle,
  Sparkles,
  Info,
  ArrowRight,
  RefreshCw,
  FileWarning,
  ShieldAlert,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { useScheduleStore, useFacultyStore, useOptimisticStore } from "@/lib/store";
import { ApprovedFaculty } from "@/types";
import { parseMockHtmlDetailed, ParsedMockCourse, ParseError } from "@/lib/mock-html-parser";

interface MockHtmlUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course;
}

export default function MockHtmlUploadModal({
  isOpen,
  onClose,
  course,
}: MockHtmlUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedMockCourse | null>(null);
  const [parseError, setParseError] = useState<ParseError | null>(null);
  const [courseMismatchInfo, setCourseMismatchInfo] = useState<{
    fileCourseCode: string;
    fileCourseTitle: string;
  } | null>(null);
  const [slotDiscrepancy, setSlotDiscrepancy] = useState<{
    matched: string[];
    extra: string[];
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { approvedFaculties } = useFacultyStore();
  const { setCourseCustomOverride } = useOptimisticStore();

  const handleReset = () => {
    setSelectedFile(null);
    setParsedData(null);
    setParseError(null);
    setCourseMismatchInfo(null);
    setSlotDiscrepancy(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const processFile = async (file: File) => {
    setSelectedFile(file);
    setParsedData(null);
    setParseError(null);
    setCourseMismatchInfo(null);
    setSlotDiscrepancy(null);

    // 1. Check File Extension
    const fileNameLower = file.name.toLowerCase();
    if (!fileNameLower.endsWith(".html") && !fileNameLower.endsWith(".htm")) {
      const extension = file.name.includes(".") ? file.name.split(".").pop()?.toUpperCase() : "UNKNOWN";
      setParseError({
        code: "NON_HTML" as any,
        title: `Unsupported File Format (.${extension})`,
        message: `You uploaded a .${extension} file. This tool requires the .html file saved from the Mock FFCS registration website.`,
        suggestion: "In Mock FFCS registration, press Ctrl+S (or Cmd+S on Mac) and save as 'Webpage, HTML Only' (.html).",
      });
      return;
    }

    // 2. Check File Size (Max 15MB)
    if (file.size > 15 * 1024 * 1024) {
      setParseError({
        code: "FILE_TOO_LARGE",
        title: "File Too Large",
        message: `The uploaded file is ${(file.size / (1024 * 1024)).toFixed(1)}MB. HTML files saved from the portal are typically under 1MB.`,
        suggestion: "When saving the page, choose 'Webpage, HTML Only' instead of 'Webpage, Complete' to avoid saving unnecessary files.",
      });
      return;
    }

    // 3. Read and Parse HTML with Detailed Diagnostics
    try {
      const text = await file.text();
      const result = parseMockHtmlDetailed(text);

      if (!result.success || !result.data) {
        setParseError(
          result.error || {
            code: "NO_VTOP_COURSE_DATA",
            title: "Unrecognized HTML File",
            message: "Could not find course registration details in this file.",
            suggestion: "Ensure you saved the specific course registration popup from the Mock FFCS portal.",
          }
        );
        return;
      }

      const parsed = result.data;

      // 4. Check Course Code Mismatch
      if (parsed.courseCode.toUpperCase() !== course.code.toUpperCase()) {
        setCourseMismatchInfo({
          fileCourseCode: parsed.courseCode,
          fileCourseTitle: parsed.courseTitle,
        });
        return;
      }

      // 5. Check Slot Discrepancies against Finalized Circular
      const officialSlots = new Set([
        ...(course.theorySlots || []),
        ...(course.labSlots || []),
      ]);

      const uploadedSlots = [
        ...parsed.theoryOfferings.map((o) => o.slot),
        ...parsed.labOfferings.map((o) => o.slot),
      ];

      const extraSlots = Array.from(
        new Set(uploadedSlots.filter((slot) => !officialSlots.has(slot)))
      );
      const matchedSlots = Array.from(
        new Set(uploadedSlots.filter((slot) => officialSlots.has(slot)))
      );

      if (extraSlots.length > 0) {
        setSlotDiscrepancy({
          matched: matchedSlots,
          extra: extraSlots,
        });
      } else {
        setSlotDiscrepancy(null);
      }

      setParsedData(parsed);
    } catch (err: any) {
      console.error("Error reading file:", err);
      setParseError({
        code: "EMPTY_FILE",
        title: "File Read Error",
        message: "Failed to read the file contents.",
        suggestion: "The file may be corrupted or blocked by browser permissions. Please re-download and try again.",
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleApply = async (isCleanMatch: boolean) => {
    if (!parsedData) return;
    setIsSubmitting(true);

    try {
      const allOfferings = [
        ...parsedData.theoryOfferings,
        ...parsedData.labOfferings,
      ];

      if (allOfferings.length === 0) {
        toast.error("No valid faculty offerings were found in the uploaded file.");
        setIsSubmitting(false);
        return;
      }

      // 1. Prepare ApprovedFaculty map & Teacher objects for immediate local store injection
      const newOverrideRecord: Record<string, ApprovedFaculty> = {};
      const newTeachersToAdd: Teacher[] = [];

      allOfferings.forEach((offering) => {
        const cleanSlot = offering.slot.trim().toUpperCase();
        const cleanFac = offering.faculty.trim();
        const cleanVen = offering.venue.trim().toUpperCase();
        const docId = `${course.code}_${cleanSlot}_${cleanFac.replace(/[^a-zA-Z0-9]/g, "_")}`;

        newOverrideRecord[docId] = {
          id: docId,
          courseCode: course.code,
          courseTitle: course.name,
          slot: cleanSlot,
          faculty: cleanFac,
          venue: cleanVen,
          approvedAt: new Date().toISOString(),
          approvedBy: isCleanMatch ? "Community Verified" : "Custom Local Mock",
        };

        const periods = cleanSlot.split("+").map(s => s.trim()).filter(Boolean);
        const isLab = periods.some(s => s.startsWith("L") && /[0-9]/.test(s));

        newTeachersToAdd.push({
          id: docId,
          course: course.id,
          name: cleanSlot,
          faculty: cleanFac,
          color: isLab ? "#0ea5e9" : "#8b5cf6",
          slots: { morning: periods, afternoon: null },
          venue: { morning: cleanVen, afternoon: null },
        });
      });

      // 2. Save custom override locally on the user's device
      setCourseCustomOverride(course.code, newOverrideRecord);

      // 3. Remove any previous placeholder "-" teachers for this course and add real teachers
      const state = useScheduleStore.getState();
      const existingPlaceholderIds = state.teachers
        .filter((t) => t.course === course.id && (!t.faculty || t.faculty === "-"))
        .map((t) => t.id);

      if (existingPlaceholderIds.length > 0) {
        state.removeTeachers(existingPlaceholderIds);
      }
      state.addTeachers(newTeachersToAdd);

      // 4. Silent Crowdsource Backend Submission (ONLY for 100% clean matches!)
      const isAlreadyPublic = Object.values(approvedFaculties).some(
        (f) => f.courseCode === course.code && f.faculty && f.faculty !== "-"
      );

      if (isCleanMatch && !isAlreadyPublic) {
        try {
          fetch("/api/crowdsource/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              courseCode: course.code,
              courseTitle: course.name,
              courseType: parsedData.courseType,
              credits: parsedData.credits,
              offerings: allOfferings,
              userUid: user?.uid || null,
            }),
          }).catch((err) => {
            console.warn("Background crowdsource submission non-blocking error:", err);
          });
        } catch (submitErr) {
          console.warn("Crowdsource post error:", submitErr);
        }
      }

      toast.success(`Loaded ${allOfferings.length} faculty offerings for ${course.code}!`);
      handleClose();
    } catch (error: any) {
      console.error("Error applying mock data:", error);
      toast.error(error.message || "Failed to apply faculty data.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader className="shrink-0 pb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">
                Add Mock FFCS HTML
              </DialogTitle>
              <DialogDescription className="text-sm">
                Import faculty and venue details for <span className="font-semibold text-foreground">{course.code}</span> ({course.name})
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* File Upload Zone */}
          {!parsedData && !parseError && !courseMismatchInfo && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border hover:border-primary/50 transition-colors rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer bg-secondary/10 hover:bg-secondary/20 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".html,.htm"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3 group-hover:scale-110 transition-transform">
                <UploadCloud className="w-7 h-7" />
              </div>
              <p className="font-semibold text-foreground text-base">
                Click to browse or drag & drop your Mock FFCS HTML
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                In Mock FFCS registration, press <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[11px]">Ctrl + S</kbd> (or <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[11px]">Cmd + S</kbd>) to save the page as an HTML file.
              </p>
            </div>
          )}

          {/* Exception Screen 1: Parser Diagnostics Error */}
          {parseError && (
            <div className="p-5 rounded-xl bg-destructive/10 border border-destructive/20 space-y-3 animate-in fade-in">
              <div className="flex items-start gap-3">
                <FileWarning className="w-6 h-6 text-destructive shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-base font-bold text-destructive">
                    {parseError.title}
                  </h3>
                  <p className="text-sm mt-1 text-destructive/90 leading-relaxed">
                    {parseError.message}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-background/80 border border-destructive/20 text-xs space-y-1">
                <p className="font-bold text-foreground flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-primary" /> What you can do:
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  {parseError.suggestion}
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="text-xs flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Select Another File
                </Button>
              </div>
            </div>
          )}

          {/* Exception Screen 2: Course Mismatch Error */}
          {courseMismatchInfo && (
            <div className="p-5 rounded-xl bg-destructive/10 border border-destructive/20 space-y-4 animate-in fade-in">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-6 h-6 text-destructive shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-base font-bold text-destructive">
                    Course Code Mismatch
                  </h3>
                  <p className="text-sm mt-1 text-destructive/90 leading-relaxed">
                    The uploaded HTML file belongs to a different course than the one you are editing.
                  </p>
                </div>
              </div>

              {/* Side by side comparison */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-background/80 border border-border">
                  <p className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                    Current Target Course
                  </p>
                  <p className="text-sm font-bold text-foreground mt-1">
                    {course.code}
                  </p>
                  <p className="text-muted-foreground truncate">{course.name}</p>
                </div>

                <div className="p-3 rounded-lg bg-destructive/15 border border-destructive/30">
                  <p className="text-destructive font-semibold uppercase tracking-wider text-[10px]">
                    Uploaded HTML File Course
                  </p>
                  <p className="text-sm font-bold text-destructive mt-1">
                    {courseMismatchInfo.fileCourseCode}
                  </p>
                  <p className="text-destructive/80 truncate">
                    {courseMismatchInfo.fileCourseTitle}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-background/80 border border-border text-xs text-muted-foreground">
                Please upload the HTML file for <strong>{course.code}</strong>. You can save it from the registration portal by opening the {course.code} course registration popup.
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="text-xs flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Upload File for {course.code}
                </Button>
              </div>
            </div>
          )}

          {/* Exception Screen 3: Parsed Results with Slot Discrepancy Warning */}
          {parsedData && slotDiscrepancy && (
            <div className="p-5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 space-y-3 animate-in fade-in">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-base font-bold text-amber-900 dark:text-amber-200">
                    Slot Discrepancy Warning
                  </h3>
                  <p className="text-xs mt-1 text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                    Some slots in this file do not match our finalized circular for <strong>{course.code}</strong>:
                  </p>
                </div>
              </div>

              {/* Badges of extra slots */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {slotDiscrepancy.extra.map((slot) => (
                  <span
                    key={slot}
                    className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-900 dark:text-amber-200 font-mono text-xs font-bold border border-amber-500/40"
                  >
                    {slot}
                  </span>
                ))}
              </div>

              <div className="p-3 rounded-lg bg-background/80 border border-amber-500/30 text-xs space-y-1">
                <p className="font-bold text-foreground">Local-Only Isolation Mode:</p>
                <p className="text-muted-foreground leading-relaxed">
                  If you proceed, this data will be applied <strong>only on your personal browser</strong> so you can plan your timetable. It will <strong>NOT</strong> be uploaded to the server or shared with other students to protect community data accuracy.
                </p>
              </div>
            </div>
          )}

          {/* Clean Match / Overview Preview */}
          {parsedData && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-card">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      {parsedData.courseCode} - {parsedData.courseTitle}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Found {parsedData.theoryOfferings.length} Theory slots & {parsedData.labOfferings.length} Lab slots ({parsedData.credits} Credits)
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={handleReset} className="text-xs">
                  Change File
                </Button>
              </div>

              {/* Offerings Table Preview */}
              <div className="border border-border rounded-xl overflow-hidden max-h-52 overflow-y-auto">
                <div className="bg-muted/50 px-4 py-2 border-b border-border grid grid-cols-[1.2fr_2fr_1.2fr] text-xs font-bold text-muted-foreground uppercase sticky top-0 bg-background/95 backdrop-blur-sm">
                  <span>Slot</span>
                  <span>Faculty</span>
                  <span>Venue</span>
                </div>
                <div className="divide-y divide-border">
                  {[...parsedData.theoryOfferings, ...parsedData.labOfferings]
                    .slice(0, 8)
                    .map((item, i) => (
                      <div
                        key={i}
                        className="px-4 py-2 grid grid-cols-[1.2fr_2fr_1.2fr] text-xs items-center"
                      >
                        <span className="font-semibold">{item.slot}</span>
                        <span className="truncate">{item.faculty}</span>
                        <span className="text-muted-foreground">{item.venue}</span>
                      </div>
                    ))}
                </div>
                {[...parsedData.theoryOfferings, ...parsedData.labOfferings].length > 8 && (
                  <div className="p-2 text-center text-xs text-muted-foreground bg-muted/20">
                    + {[...parsedData.theoryOfferings, ...parsedData.labOfferings].length - 8} more offerings
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="shrink-0 pt-3 border-t border-border flex sm:justify-between items-center">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>

          {parsedData && (
            slotDiscrepancy && slotDiscrepancy.extra.length > 0 ? (
              <Button
                variant="destructive"
                disabled={isSubmitting}
                onClick={() => handleApply(false)}
                className="bg-amber-600 hover:bg-amber-700 text-white font-semibold"
              >
                Proceed Anyway (Local Only)
              </Button>
            ) : (
              <Button
                disabled={isSubmitting}
                onClick={() => handleApply(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Apply & Add to My Planner
              </Button>
            )
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
