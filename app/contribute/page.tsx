"use client";

import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { AnimatedButton } from "@/components/ui/button";
import { Plus, Trash2, Send, CheckCircle2, GraduationCap, ClipboardPaste } from "lucide-react";
import { MotionDiv } from "@/components/ui/motion";

interface FacultyRow {
  courseCode: string;
  slot: string;
  facultyName: string;
  venue: string;
}

export default function ContributePage() {
  const [rows, setRows] = useState<FacultyRow[]>([
    { courseCode: "", slot: "", facultyName: "", venue: "" },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const addRow = () => {
    setRows([...rows, { courseCode: "", slot: "", facultyName: "", venue: "" }]);
  };

  const removeRow = (index: number) => {
    if (rows.length === 1) return;
    const newRows = [...rows];
    newRows.splice(index, 1);
    setRows(newRows);
  };

  const updateRow = (index: number, field: keyof FacultyRow, value: string) => {
    const newRows = [...rows];
    newRows[index][field] = value;
    setRows(newRows);
  };

  const handleSmartPaste = (e: React.ClipboardEvent<HTMLTextAreaElement> | React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = 'clipboardData' in e ? e.clipboardData.getData('text') : e.target.value;
    if (!text.trim()) return;

    // Try to find course code in the pasted text (e.g. CHY1009)
    const courseMatch = text.match(/([A-Z]{3,4}[0-9]{3,4})/);
    const pastedCourseCode = courseMatch ? courseMatch[1] : "";

    const lines = text.split('\n');
    const parsedRows: FacultyRow[] = [];

    lines.forEach(line => {
      // If they copied a table, it's usually tab-separated
      const parts = line.split('\t').map(p => p.trim()).filter(Boolean);
      
      let slotStr = "";
      let venue = "";
      let faculty = "";

      if (parts.length >= 3) {
        slotStr = parts[0];
        // Venue usually has a hyphen (e.g., CB-G14)
        const venueIndex = parts.findIndex(p => p.includes('-'));
        if (venueIndex !== -1) {
          venue = parts[venueIndex];
          faculty = parts.slice(venueIndex + 1).filter(p => isNaN(Number(p))).join(' ');
        } else {
          faculty = parts.slice(1).filter(p => isNaN(Number(p))).join(' ');
        }
      } else {
        // Space separated fallback parsing
        const slotMatch = line.match(/^([A-Z0-9+]{2,})\s+/);
        if (slotMatch) {
          slotStr = slotMatch[1];
          const rest = line.substring(slotMatch[0].length).trim();
          
          const venueMatch = rest.match(/^([A-Z0-9]+-[A-Z0-9]+)\s+/);
          if (venueMatch) {
            venue = venueMatch[1];
            faculty = rest.substring(venueMatch[0].length).trim();
          } else {
            faculty = rest;
          }
          // Remove trailing numbers (availability)
          faculty = faculty.replace(/\s+\d+$/, '').trim();
        }
      }

      // Very basic validation to see if it looks like a slot
      if (slotStr && (slotStr.includes('+') || /^[A-G][1-2]$/i.test(slotStr) || /^L\d+/i.test(slotStr))) {
        parsedRows.push({
          courseCode: pastedCourseCode || rows[0]?.courseCode || "",
          slot: slotStr,
          facultyName: faculty,
          venue: venue
        });
      }
    });

    if (parsedRows.length > 0) {
      // If current rows are just one empty row, replace it
      if (rows.length === 1 && !rows[0].courseCode && !rows[0].slot && !rows[0].facultyName) {
        setRows(parsedRows);
      } else {
        setRows([...rows, ...parsedRows]);
      }
      
      // Clear the textarea if it was an onChange event
      if (!('clipboardData' in e)) {
        setTimeout(() => {
          e.target.value = "";
        }, 10);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Filter out completely empty rows
    const validRows = rows.filter(r => r.courseCode || r.slot || r.facultyName);
    
    if (validRows.length === 0) {
      setIsSubmitting(false);
      return;
    }

    try {
      const submissionsRef = collection(db, "faculty_submissions");
      await addDoc(submissionsRef, {
        entries: validRows.map(r => ({
          courseCode: r.courseCode.toUpperCase().trim(),
          slot: r.slot.toUpperCase().trim(),
          facultyName: r.facultyName.trim(),
          venue: r.venue.trim()
        })),
        timestamp: serverTimestamp(),
        uid: auth.currentUser?.uid || "anonymous",
        status: "pending"
      });
      
      setIsSuccess(true);
      setRows([{ courseCode: "", slot: "", facultyName: "", venue: "" }]);
      setTimeout(() => setIsSuccess(false), 5000);
    } catch (error) {
      console.error("Error submitting faculty data:", error);
      alert("Failed to submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-8 mt-10">
        <MotionDiv initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 mb-2 flex items-center gap-3">
            <GraduationCap className="w-10 h-10 text-purple-600" />
            Contribute Faculty Data
          </h1>
          <p className="text-muted-foreground text-lg">
            Help us build the most accurate timetable! Paste or enter the faculty names and venues from the Mock FFCS below. We will verify and add them to the system.
          </p>
        </MotionDiv>

        {isSuccess && (
          <MotionDiv 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-emerald-500/10 border border-emerald-500/50 rounded-xl flex items-center gap-3 text-emerald-600"
          >
            <CheckCircle2 className="w-6 h-6" />
            <p className="font-semibold">Thank you! Your contribution has been submitted successfully and will be reviewed shortly.</p>
          </MotionDiv>
        )}
        
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-2xl p-6 shadow-sm">
          <label className="flex items-center gap-2 text-sm font-bold text-purple-700 dark:text-purple-400 mb-3">
            <ClipboardPaste className="w-5 h-5" />
            Smart Paste from VTOP
          </label>
          <textarea 
            placeholder="Paste the table rows or entire text from the VTOP Mock FFCS page here... (e.g. A+A1+TA... CB-G14 GANGADHAR PAMARTHI)"
            className="w-full h-24 bg-background border border-purple-500/20 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
            onChange={handleSmartPaste}
            onPaste={handleSmartPaste}
          />
          <p className="text-xs text-muted-foreground mt-2">
            Try selecting the course details and table rows directly from the browser and paste them above. It will automatically extract the slots, venues, and faculty names!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-card border rounded-2xl p-6 shadow-sm">
          <div className="space-y-4">
            <div className="grid grid-cols-12 gap-4 px-2 hidden md:grid">
              <div className="col-span-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Course Code</div>
              <div className="col-span-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Slot (e.g. A1+TA1)</div>
              <div className="col-span-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Faculty Name</div>
              <div className="col-span-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Venue (Optional)</div>
            </div>

            {rows.map((row, index) => (
              <MotionDiv 
                key={index} 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-accent/30 p-4 md:p-2 rounded-xl border border-transparent hover:border-purple-500/30 transition-all"
              >
                <div className="col-span-1 md:col-span-3">
                  <label className="text-xs font-semibold md:hidden block mb-1">Course Code</label>
                  <input 
                    type="text" 
                    placeholder="MAT1011"
                    required
                    value={row.courseCode}
                    onChange={(e) => updateRow(index, "courseCode", e.target.value)}
                    className="w-full bg-background border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 uppercase"
                  />
                </div>
                <div className="col-span-1 md:col-span-3">
                  <label className="text-xs font-semibold md:hidden block mb-1">Slot</label>
                  <input 
                    type="text" 
                    placeholder="A1+TA1"
                    required
                    value={row.slot}
                    onChange={(e) => updateRow(index, "slot", e.target.value)}
                    className="w-full bg-background border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 uppercase"
                  />
                </div>
                <div className="col-span-1 md:col-span-4">
                  <label className="text-xs font-semibold md:hidden block mb-1">Faculty Name</label>
                  <input 
                    type="text" 
                    placeholder="Dr. John Doe"
                    required
                    value={row.facultyName}
                    onChange={(e) => updateRow(index, "facultyName", e.target.value)}
                    className="w-full bg-background border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
                <div className="col-span-1 md:col-span-2 flex items-center gap-2">
                  <div className="flex-1">
                    <label className="text-xs font-semibold md:hidden block mb-1">Venue (Opt)</label>
                    <input 
                      type="text" 
                      placeholder="AB1-100"
                      value={row.venue}
                      onChange={(e) => updateRow(index, "venue", e.target.value)}
                      className="w-full bg-background border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                  </div>
                  {rows.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => removeRow(index)}
                      className="p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors mt-5 md:mt-0"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </MotionDiv>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t gap-4">
            <AnimatedButton 
              type="button"
              variant="outline" 
              onClick={addRow}
              className="w-full sm:w-auto border-dashed border-2 hover:bg-purple-500/10 hover:text-purple-600 hover:border-purple-500/50 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Another Row
            </AnimatedButton>
            
            <AnimatedButton 
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold shadow-lg shadow-purple-500/25 px-8"
            >
              {isSubmitting ? "Submitting..." : "Submit Contributions"}
              {!isSubmitting && <Send className="w-4 h-4 ml-2" />}
            </AnimatedButton>
          </div>
        </form>
      </div>
    </div>
  );
}
