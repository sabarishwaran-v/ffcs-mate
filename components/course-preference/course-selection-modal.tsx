"use client";

import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { AnimatedButton } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { useScheduleStore } from "@/lib/store";
import { MOCK_COURSES } from "@/lib/mock-data";
import { Search, BookOpen, GraduationCap, ArrowRight, Check, Plus, X } from "lucide-react";
import { MotionDiv } from "@/components/ui/motion";

export function CourseSelectionModal() {
  const [isOpen, setIsOpen] = useState(false);
  const { courses, addCourse, removeCourse, teachers, addTeacher } = useScheduleStore();
  
  // Initialize with current Zustand courses
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const handleOpen = (open: boolean) => {
    if (open) {
      setSelectedCourseIds(courses.map(c => c.id));
      setSearchQuery("");
    }
    setIsOpen(open);
  };

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

  const handleProceed = () => {
    // Explicitly update the Zustand store right here
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

    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <AnimatedButton variant="outline" className="bg-sky-600/10 text-sky-400 hover:bg-sky-600/20 border-sky-500/30">
          Edit Course Selection
        </AnimatedButton>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[95vw] lg:max-w-[1200px] w-full h-[90vh] flex flex-col p-0 overflow-hidden bg-background/95 backdrop-blur-xl border-purple-500/20">
        <div className="flex-1 overflow-y-auto p-6 flex flex-col lg:flex-row gap-8">
          
          {/* Left Side: Master Course List */}
          <div className="flex-1 space-y-6">
            <MotionDiv className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                  Course Selection
                </h1>
                <p className="text-muted-foreground mt-1 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  Active Semester
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
                      className={`relative flex flex-col p-5 rounded-2xl border transition-all duration-300 cursor-pointer group ${
                        isSelected 
                          ? "bg-purple-500/10 border-purple-500/50 shadow-[0_0_20px_-5px_rgba(168,85,247,0.3)]" 
                          : "bg-card border-border hover:border-purple-500/30 hover:bg-accent/50 hover:shadow-md"
                      }`}
                      onClick={() => toggleCourse(course.id)}
                    >
                      {/* Checkbox indicator */}
                      <div className={`absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected ? "bg-purple-500 border-purple-500 text-white" : "border-muted-foreground/30 text-transparent group-hover:border-purple-500/50"
                      }`}>
                        <Check className="w-4 h-4" />
                      </div>
                      <div className="flex items-center gap-2 mb-2 pr-8">
                        <span className="px-2.5 py-1 rounded-md bg-secondary text-xs font-bold tracking-wide text-foreground">
                          {course.code}
                        </span>
                        <span className="text-xs text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded-full">
                          {course.credits} Credits
                        </span>
                      </div>
                      <h3 className="font-semibold text-foreground/90 leading-tight mb-4 flex-1">
                        {course.title}
                      </h3>
                      <div className="flex gap-2">
                        <span className="px-2 py-1 bg-background/50 border rounded text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                          {course.type}
                        </span>
                      </div>
                    </MotionDiv>
                  );
                })
              ) : (
                <div className="col-span-full py-12 text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                  <p className="text-lg font-medium text-foreground/80">No courses found</p>
                  <p className="text-sm text-muted-foreground">Try adjusting your search terms.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Selected Courses Sidebar */}
          <div className="w-full lg:w-80 xl:w-96 shrink-0">
            <MotionDiv 
              className="sticky top-0 bg-card border border-border rounded-2xl flex flex-col h-full shadow-lg overflow-hidden"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="p-4 bg-muted/30 border-b flex justify-between items-center">
                <h2 className="font-semibold text-lg flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-purple-500" />
                  Your Cart
                </h2>
                <div className="bg-purple-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                  {selectedCourseIds.length}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px]">
                {selectedCourseIds.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-3 opacity-60 py-12">
                    <div className="w-16 h-16 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                      <Plus className="w-8 h-8 text-muted-foreground/50" />
                    </div>
                    <p className="text-sm font-medium">Your cart is empty.</p>
                    <p className="text-xs text-muted-foreground px-4">Click on courses to add them to your selection.</p>
                  </div>
                ) : (
                  selectedCourseIds.map(id => {
                    const course = MOCK_COURSES.find(c => c.id === id);
                    if (!course) return null;
                    return (
                      <MotionDiv 
                        key={id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-background border rounded-xl p-3 relative group shadow-sm"
                      >
                        <button 
                          onClick={() => toggleCourse(id)}
                          className="absolute top-2 right-2 p-1.5 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <div className="flex flex-col pr-6">
                          <span className="text-xs font-bold text-foreground mb-1">{course.code}</span>
                          <span className="text-sm text-muted-foreground line-clamp-2 leading-snug">{course.title}</span>
                        </div>
                      </MotionDiv>
                    );
                  })
                )}
              </div>

              <div className="p-4 bg-background border-t space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground font-medium">Total Credits</span>
                  <span className="font-bold text-lg">
                    {selectedCourseIds.reduce((total, id) => {
                      const course = MOCK_COURSES.find(c => c.id === id);
                      return total + (course?.credits || 0);
                    }, 0)}
                  </span>
                </div>
                
                <AnimatedButton 
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white border-0 shadow-lg shadow-purple-500/25 h-12 text-base font-semibold"
                  disabled={selectedCourseIds.length === 0}
                  onClick={handleProceed}
                >
                  Confirm Changes
                  <ArrowRight className="w-5 h-5 ml-2" />
                </AnimatedButton>
              </div>
            </MotionDiv>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
