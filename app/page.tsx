"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, PlayCircle, Info, Users, ShieldAlert, Download, CalendarCheck, Sparkles, Loader2, CheckCircle2, Database } from "lucide-react";

import { Footer } from "@/components/footer";
import { MotionDiv, ScrollAnimation, Stagger } from "@/components/ui/motion";
import { AnimatedButton, Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useScheduleStore } from "@/lib/store";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function Dashboard() {
  const router = useRouter();
  const activeSemester = useScheduleStore(state => state.activeSemester);
  const courses = useScheduleStore(state => state.courses);
  const [selectedSemester, setSelectedSemester] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [isContinueOpen, setIsContinueOpen] = useState(false);
  
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionComplete, setExtractionComplete] = useState(false);
  const [dataAcknowledged, setDataAcknowledged] = useState(false);

  const handleSemesterSelect = (val: string) => {
    setSelectedSemester(val);
    setIsExtracting(true);
    setExtractionComplete(false);
    setDataAcknowledged(false);

    // Mock Data Extraction
    setTimeout(() => {
      setIsExtracting(false);
      setExtractionComplete(true);
      // Auto-tick the acknowledgement for a better UX feel
      setDataAcknowledged(true);
    }, 2500);
  };

  return (
    <main className="min-h-screen bg-background overflow-hidden relative selection:bg-purple-500/30 flex flex-col">
      {/* Announcement Banner */}
      <div className="w-full bg-amber-500/10 border-b border-amber-500/20 relative z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-center text-sm text-amber-700 dark:text-amber-400 font-semibold text-center">
          <ShieldAlert className="w-4 h-4 mr-2 inline-block shrink-0" />
          Fall 2026-27 Registration is on July 5th & 6th! We will update the course data as soon as the university releases it.
        </div>
      </div>

      {/* Abstract Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] left-[50%] w-[30%] h-[30%] rounded-full bg-emerald-600/5 blur-[100px] pointer-events-none translate-x-[-50%] translate-y-[-50%]" />

      <div className="container mx-auto px-4 pt-24 pb-16 relative z-10 flex flex-col items-center flex-1">
        
        {/* HERO SECTION */}
        <div className="text-center max-w-4xl mx-auto mb-24 mt-8">
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 text-sm font-medium mb-8">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span>FFCS Mate 2.0 is Here</span>
            </div>
          </MotionDiv>
          
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 text-foreground leading-[1.1]">
              Master Your Semester with <br className="hidden md:block" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500">
                FFCS Mate
              </span>
            </h1>
          </MotionDiv>
          
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <p className="text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed max-w-2xl mx-auto">
              Say goodbye to clashing slots and messy spreadsheets. Collaborate with friends in real-time, instantly detect clashes, and build your perfect schedule before registration begins.
            </p>
          </MotionDiv>
          
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <AnimatedButton onClick={() => setIsDialogOpen(true)} size="lg" className="w-full sm:w-auto px-8 py-6 text-lg rounded-xl bg-foreground text-background hover:bg-foreground/90 shadow-xl shadow-foreground/5 group">
              Start Planning Now
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </AnimatedButton>
            <AnimatedButton onClick={() => setIsVideoOpen(true)} variant="outline" size="lg" className="w-full sm:w-auto px-8 py-6 text-lg rounded-xl border-border bg-card/50 backdrop-blur hover:bg-muted/50">
              <PlayCircle className="mr-2 w-5 h-5" />
              Watch Demo
            </AnimatedButton>
          </MotionDiv>
        </div>

        {/* FEATURES GRID */}
        <Stagger staggerDelay={0.15} animation="slideUp" className="w-full max-w-6xl mx-auto mb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Feature 1 */}
            <MotionDiv 
              className="rounded-3xl border border-border/50 bg-card/30 backdrop-blur-md p-8 relative overflow-hidden group hover:border-purple-500/30 transition-colors"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-purple-500/20 transition-colors" />
              <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6 text-purple-600">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-foreground">Real-time Collaboration</h3>
              <p className="text-muted-foreground leading-relaxed">
                Invite friends to your Room and build your timetables together simultaneously. Compare and share schedules instantly.
              </p>
            </MotionDiv>

            {/* Feature 2 */}
            <MotionDiv 
              className="rounded-3xl border border-border/50 bg-card/30 backdrop-blur-md p-8 relative overflow-hidden group hover:border-red-500/30 transition-colors"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-red-500/20 transition-colors" />
              <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 text-red-600">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-foreground">Smart Clash Detection</h3>
              <p className="text-muted-foreground leading-relaxed">
                Never accidentally pick overlapping courses again. FFCS Mate highlights clashing slots in red before you even save.
              </p>
            </MotionDiv>

            {/* Feature 3 */}
            <MotionDiv 
              className="rounded-3xl border border-border/50 bg-card/30 backdrop-blur-md p-8 relative overflow-hidden group hover:border-emerald-500/30 transition-colors"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-emerald-500/20 transition-colors" />
              <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 text-emerald-600">
                <Download className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-foreground">Export Beautifully</h3>
              <p className="text-muted-foreground leading-relaxed">
                Export your finalized timetable to a pristine Image or PDF. Keep it on your phone or share it with your friends with one click.
              </p>
            </MotionDiv>
            
          </div>
        </Stagger>
      </div>

      <div className="mt-auto">
        <Footer />
      </div>

      {/* Video Demo Dialog */}
      <Dialog open={isVideoOpen} onOpenChange={setIsVideoOpen}>
        <DialogContent className="sm:max-w-5xl max-w-[95vw] bg-black border-border/50 p-0 overflow-hidden rounded-2xl w-[95vw]">
          <div className="relative aspect-video w-full bg-black">
            <video 
              controls 
              autoPlay 
              playsInline
              className="w-full h-full object-contain"
              src="/demo-video.mov"
            >
              Your browser does not support the video tag.
            </video>
          </div>
          <div className="p-4 bg-zinc-950 flex justify-between items-center border-t border-zinc-800">
            <p className="text-zinc-400 text-sm font-medium">FFCS Mate v2.0 Demo</p>
            <Button variant="outline" onClick={() => setIsVideoOpen(false)} className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white">
              Close Player
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Onboarding Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) {
          // Reset states when closed
          setSelectedSemester("");
          setIsExtracting(false);
          setExtractionComplete(false);
          setDataAcknowledged(false);
        }
      }}>
        <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden bg-card border-border/50 shadow-2xl rounded-3xl">
          {/* Header image/gradient */}
          <div className="h-32 bg-gradient-to-br from-purple-500/20 via-blue-500/20 to-cyan-500/20 w-full relative">
            <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:16px_16px]" />
            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-card to-transparent" />
            <div className="absolute bottom-[-24px] left-6">
              <div className="bg-card p-3 rounded-2xl shadow-xl border border-border/50">
                <CalendarCheck className="w-8 h-8 text-purple-500" />
              </div>
            </div>
          </div>

          <div className="p-6 pt-10">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-extrabold tracking-tight">Select Semester</DialogTitle>
              <DialogDescription className="text-base mt-2">
                Choose your upcoming semester to access the correct course list and slot data.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 mb-8">
              <div className="relative">
                <select 
                  className="w-full bg-background border border-border rounded-xl p-4 pr-12 text-foreground font-medium text-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 hover:border-purple-500/50 transition-all appearance-none cursor-pointer"
                  value={selectedSemester}
                  onChange={(e) => handleSemesterSelect(e.target.value)}
                  disabled={isExtracting}
                >
                  <option value="" disabled>-- Select a Semester --</option>
                  <option value="winter2025">Winter Semester 2025-26</option>
                  <option value="fall2026" disabled>Fall Semester 2026-27 (Coming Soon)</option>
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                  {isExtracting ? (
                    <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4.18179 6.18181C4.35753 6.00608 4.64245 6.00608 4.81819 6.18181L7.49999 8.86362L10.1818 6.18181C10.3575 6.00608 10.6424 6.00608 10.8182 6.18181C10.9939 6.35755 10.9939 6.64247 10.8182 6.81821L7.81819 9.81821C7.73379 9.9026 7.61934 9.95001 7.49999 9.95001C7.38064 9.95001 7.26618 9.9026 7.18179 9.81821L4.18179 6.81821C4.00605 6.64247 4.00605 6.35755 4.18179 6.18181Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                    </svg>
                  )}
                </div>
              </div>

              {isExtracting && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 animate-pulse">
                  <Database className="w-5 h-5 text-purple-500 animate-bounce" />
                  <div className="text-sm font-medium text-purple-600 dark:text-purple-400">
                    Extracting data, assigning credits, and preparing courses...
                  </div>
                </div>
              )}

              {extractionComplete && (
                <div className="flex flex-col gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="flex items-start gap-3 cursor-default group">
                    <div className="relative flex items-center justify-center mt-0.5">
                      <input 
                        type="checkbox" 
                        className="peer sr-only"
                        checked={dataAcknowledged}
                        readOnly
                        disabled
                      />
                      <div className="w-5 h-5 rounded-full border-2 border-emerald-500 bg-emerald-500 transition-all flex items-center justify-center shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-white opacity-100 transition-opacity" strokeWidth={3} />
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 leading-snug">
                      All required data is ready
                    </span>
                  </label>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl px-6">
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (activeSemester && activeSemester !== selectedSemester) {
                    setIsWarningOpen(true);
                  } else {
                    // If activeSemester is null, we must initialize it so PlannerGuard doesn't kick us out!
                    if (!activeSemester) {
                      useScheduleStore.getState().setSemester(selectedSemester);
                      // Since setSemester wipes courses if it changes, we check fresh state
                      const freshCourses = useScheduleStore.getState().courses;
                      if (freshCourses.length > 0) {
                        setIsDialogOpen(false);
                        setIsContinueOpen(true);
                      } else {
                        router.push(`/select-courses?semester=${selectedSemester}`);
                      }
                      return;
                    }

                    if (courses.length > 0) {
                      setIsDialogOpen(false);
                      setIsContinueOpen(true);
                    } else {
                      router.push(`/select-courses?semester=${selectedSemester}`);
                    }
                  }
                }}
                disabled={!selectedSemester || !dataAcknowledged}
                className="rounded-xl px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-purple-500/25 border-0"
              >
                Continue
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isWarningOpen} onOpenChange={setIsWarningOpen}>
        <AlertDialogContent className="bg-card border border-red-500/30 rounded-2xl shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-red-500" />
              Are you sure?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base text-muted-foreground mt-2">
              You already have an active timetable for your previous semester. Switching to a new semester will <strong className="text-red-500 font-semibold">permanently delete</strong> all your currently selected courses and timetables so you can start fresh.
              <br /><br />
              Do you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6">
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                // The wiping logic is safely handled by setSemester inside select-courses page load
                // We just need to route them!
                router.push(`/select-courses?semester=${selectedSemester}`);
              }}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl border-0"
            >
              Wipe and Switch
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isContinueOpen} onOpenChange={setIsContinueOpen}>
        <AlertDialogContent className="bg-card border border-border rounded-2xl shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold flex items-center gap-2">
              <CalendarCheck className="w-6 h-6 text-purple-500" />
              Resume Session
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base text-muted-foreground mt-2">
              We found an existing timetable and course selection in your browser. Do you want to resume planning where you left off, or start completely fresh?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 sm:justify-end flex-col sm:flex-row gap-3">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsContinueOpen(false);
                useScheduleStore.getState().clearAll();
                router.push(`/select-courses?semester=${selectedSemester}`);
              }} 
              className="rounded-xl border-red-500/50 text-red-500 hover:bg-red-500/10 hover:text-red-600"
            >
              Start New (Discard Old)
            </Button>
            <Button 
              onClick={() => {
                setIsContinueOpen(false);
                router.push('/planner');
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl border-0"
            >
              Continue Planning
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </main>
  );
}
