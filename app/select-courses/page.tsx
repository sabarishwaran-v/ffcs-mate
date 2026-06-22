"use client";

import { Title } from "@/components/title";
import { Footer } from "@/components/footer";
import { MotionDiv, Parallax, ScrollAnimation, Stagger } from "@/components/ui/motion";
import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { MOCK_COURSES, Course } from "@/lib/mock-data";
import { Search, Check, Plus, ArrowRight, X, BookOpen, GraduationCap, ChevronUp, Loader2 } from "lucide-react";
import { AnimatedButton } from "@/components/ui/button";
import { useScheduleStore } from "@/lib/store";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "sonner";

import { Suspense } from "react";
import { ErrorBoundary } from "@/components/error-boundary";

function SelectCoursesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const semester = searchParams?.get("semester");
  const setSemester = useScheduleStore(state => state.setSemester);

  useEffect(() => {
    // Only set the semester in Zustand once searchParams has successfully hydrated it
    if (semester) {
      setSemester(semester);
    }
  }, [semester, setSemester]);

  // If semester is null, Next.js might still be hydrating the URL parameters.
  // Instead of violently kicking the user out, we just wait safely.
  if (!semester) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        <p className="text-muted-foreground animate-pulse">Loading semester data...</p>
        <AnimatedButton variant="outline" onClick={() => router.push("/")} className="mt-4">
          Return to Home
        </AnimatedButton>
      </div>
    );
  }

  const semesterName = semester === 'winter2025' ? 'Winter Semester 2025-26' : 'Active Semester';

  const [searchQuery, setSearchQuery] = useState("");
  const coursesParam = searchParams?.get("courses");
  const initialCourses = coursesParam ? coursesParam.split(",") : [];
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>(initialCourses);

  useEffect(() => {
    const hasSeenMobileAlert = sessionStorage.getItem("hasSeenMobileAlert");
    if (!hasSeenMobileAlert && window.innerWidth < 768) {
      toast.info("📱 Mobile Device Detected", {
        description: "For the best experience, please turn on 'Desktop Site' in your browser settings!",
        duration: 8000,
        position: "top-center",
      });
      sessionStorage.setItem("hasSeenMobileAlert", "true");
    }
  }, []);

  // Filter courses based on search
  const filteredCourses = useMemo(() => {
    return MOCK_COURSES.filter(course => 
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      course.code.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const toggleCourse = (id: string) => {
    setSelectedCourseIds(prev => 
      prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
    );
  };

  const { courses, addCourse, removeCourse, teachers, addTeacher } = useScheduleStore();

  const handleProceed = () => {
    if (selectedCourseIds.length === 0) return;
    
    // Explicitly update the Zustand store right here, instead of relying on URL sync later!
    const currentCourseIds = courses.map(c => c.id);
    const toRemove = currentCourseIds.filter(id => !selectedCourseIds.includes(id));
    toRemove.forEach(id => removeCourse(id));

    selectedCourseIds.forEach(id => {
      const mockData = MOCK_COURSES.find(c => c.id === id);
      if (mockData) {
        if (!courses.find(c => c.id === id)) {
          addCourse({
            id: mockData.id,
            code: mockData.code,
            name: mockData.title,
            credits: mockData.credits,
            type: mockData.type,
            theorySlots: mockData.theorySlots,
            labSlots: mockData.labSlots,
          });
        }
        const allSlots = [...(mockData.theorySlots || []), ...(mockData.labSlots || [])];
        allSlots.forEach(slotStr => {
          const fakeTeacherId = `${mockData.id}-${slotStr}`;
          if (!teachers.find(t => t.id === fakeTeacherId)) {
            const parsedPeriods = slotStr.split('+').map(s => s.trim());
            const isLab = parsedPeriods.some(s => s.startsWith('L') && /[0-9]/.test(s));
            addTeacher({
              id: fakeTeacherId,
              name: slotStr, 
              color: isLab ? "#0ea5e9" : "#8b5cf6",
              slots: { morning: parsedPeriods, afternoon: null },
              venue: { morning: null, afternoon: null },
              course: mockData.id,
            });
          }
        });
      }
    });

    const roomId = searchParams?.get("roomId");
    if (roomId) {
      // Because we are not in the room yet, RoomSyncProvider is not mounted.
      // We must manually push our local mutations to the cloud before redirecting!
      import("@/lib/store/sync").then(({ syncToCloud }) => {
        const state = useScheduleStore.getState();
        syncToCloud(roomId, {
          timetables: state.timetables,
          courses: state.courses,
          teachers: state.teachers,
          activeTimetableId: state.activeTimetableId
        }).then(() => {
          router.push(`/room/${roomId}`);
        });
      });
    } else {
      router.push(`/planner?courses=${selectedCourseIds.join(",")}`);
    }
  };

  const totalCredits = useMemo(() => {
    return selectedCourseIds.reduce((total, id) => {
      const c = MOCK_COURSES.find(c => c.id === id);
      return total + (c?.credits || 0);
    }, 0);
  }, [selectedCourseIds]);

  return (
    <>
      <div className="flex-1 flex flex-col lg:flex-row gap-8 pb-24 lg:pb-0">
        
        {/* Left Side: Master Course List */}
        <div className="flex-1 space-y-6">
          <MotionDiv className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                Course Selection
              </h1>
              <p className="text-muted-foreground mt-1 flex items-center gap-2">
                <GraduationCap className="w-4 h-4" />
                {semesterName}
              </p>
            </div>
          </MotionDiv>

          <MotionDiv 
            className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex items-start gap-3"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="bg-blue-500/20 p-2 rounded-full text-blue-600 dark:text-blue-400 mt-0.5 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-700 dark:text-blue-300">Step 1: Select Your Courses</h3>
              <p className="text-sm text-blue-700/80 dark:text-blue-300/80 mt-1 leading-relaxed">
                Before Planning your timetable, you must select the courses you wish to take this semester. 
                Search the list below and add them to your selection cart. Once you have picked everything you need, 
                click Proceed to start planning your {semesterName}!!
              </p>
            </div>
          </MotionDiv>

          <MotionDiv className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <input
              type="text"
              placeholder="Search by course code or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-4 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 shadow-sm transition-all"
            />
          </MotionDiv>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredCourses.length > 0 ? (
              filteredCourses.map(course => {
                const isSelected = selectedCourseIds.includes(course.id);
                return (
                  <MotionDiv 
                    key={course.id}
                    className={`relative p-5 rounded-xl border transition-all cursor-pointer overflow-hidden group ${
                      isSelected 
                        ? 'bg-purple-500/10 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.15)]' 
                        : 'bg-card border-border hover:border-purple-500/30 hover:shadow-md'
                    }`}
                    onClick={() => toggleCourse(course.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-bold rounded-md">
                        {course.code}
                      </span>
                      <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-md">
                        {course.credits} Credits
                      </span>
                    </div>
                    <h3 className="font-semibold text-foreground line-clamp-2 min-h-[2.5rem]">{course.title}</h3>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground border border-border px-2 py-0.5 rounded-full">
                          {course.type || "N/A"}
                        </span>
                      </div>
                      
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                        isSelected ? 'bg-purple-600 text-white' : 'bg-muted text-muted-foreground group-hover:bg-purple-500/20 group-hover:text-purple-600'
                      }`}>
                        {isSelected ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                      </div>
                    </div>
                  </MotionDiv>
                );
              })
            ) : (
              <div className="col-span-full py-12 text-center border-2 border-dashed border-border rounded-xl">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium text-foreground">No courses found</p>
                <p className="text-sm text-muted-foreground">Try adjusting your search query.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Selection Cart */}
        <MotionDiv className="w-full lg:w-80 xl:w-96 shrink-0">
          <div className="sticky top-6 bg-card border border-border rounded-2xl shadow-lg overflow-hidden flex flex-col h-[calc(100vh-120px)] max-h-[800px]">
            <div className="p-6 border-b border-border bg-muted/30">
              <h2 className="text-xl font-bold flex items-center justify-between">
                Your Selection
                <span className="bg-purple-600 text-white text-sm py-1 px-3 rounded-full">
                  {selectedCourseIds.length} {selectedCourseIds.length === 1 ? 'Course' : 'Courses'}
                </span>
              </h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {selectedCourseIds.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                  <BookOpen className="w-12 h-12 mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No courses selected yet.</p>
                  <p className="text-xs text-muted-foreground mt-1">Click on a course to add it to your list.</p>
                </div>
              ) : (
                selectedCourseIds.map(id => {
                  const course = MOCK_COURSES.find(c => c.id === id);
                  if (!course) return null;
                  return (
                    <div key={id} className="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border group">
                      <div className="pr-2">
                        <p className="text-xs font-bold text-primary">{course.code}</p>
                        <p className="text-sm font-medium text-foreground line-clamp-1">{course.title}</p>
                      </div>
                      <button 
                        onClick={() => toggleCourse(id)}
                        className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-6 border-t border-border bg-card">
              <div className="flex justify-between items-center mb-4 px-1">
                <span className="text-sm font-medium text-muted-foreground">Total Credits</span>
                <span className="text-lg font-bold text-foreground">
                  {totalCredits}
                </span>
              </div>
              <AnimatedButton 
                size="lg" 
                className={`w-full py-6 text-lg rounded-xl shadow-lg transition-all group ${
                  selectedCourseIds.length > 0 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-purple-500/25 cursor-pointer' 
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                }`}
                onClick={handleProceed}
                disabled={selectedCourseIds.length === 0}
              >
                Proceed to Planner
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </AnimatedButton>
            </div>
          </div>
        </MotionDiv>
        
      </div>

      {/* Mobile Floating Action Bar */}
      {selectedCourseIds.length > 0 && (
        <MotionDiv 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-xl border-t border-border z-50 lg:hidden shadow-[0_-10px_40px_rgba(0,0,0,0.1)]"
        >
          <div className="flex items-center justify-between gap-4 max-w-md mx-auto">
            <Sheet>
              <SheetTrigger asChild>
                <div className="flex flex-col cursor-pointer hover:bg-muted/50 p-2 -ml-2 rounded-lg transition-colors">
                  <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    {selectedCourseIds.length} Courses Selected
                    <ChevronUp className="w-3 h-3 text-muted-foreground" />
                  </span>
                  <span className="font-bold text-foreground">{totalCredits} Credits Total</span>
                </div>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[80vh] rounded-t-2xl flex flex-col pt-6">
                <SheetHeader className="mb-4 text-left">
                  <SheetTitle>Your Selection</SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto space-y-3 pb-8">
                  {selectedCourseIds.map(id => {
                    const course = MOCK_COURSES.find(c => c.id === id);
                    if (!course) return null;
                    return (
                      <div key={id} className="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border">
                        <div className="pr-2">
                          <p className="text-xs font-bold text-primary">{course.code}</p>
                          <p className="text-sm font-medium text-foreground line-clamp-1">{course.title}</p>
                        </div>
                        <button 
                          onClick={() => toggleCourse(id)}
                          className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </SheetContent>
            </Sheet>
            <AnimatedButton 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
              onClick={handleProceed}
            >
              Proceed
              <ArrowRight className="ml-2 w-4 h-4" />
            </AnimatedButton>
          </div>
        </MotionDiv>
      )}
    </>
  );
}

export default function SelectCoursesPage() {
  return (
    <main className="container p-4 mx-auto min-h-screen flex flex-col">
      <ErrorBoundary>
        <Suspense fallback={<div className="p-8 text-center">Loading courses...</div>}>
          <SelectCoursesContent />
        </Suspense>
      </ErrorBoundary>
      <div className="mt-auto pt-8">
        <Footer />
      </div>
    </main>
  );
}
