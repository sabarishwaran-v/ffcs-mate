"use client";

import { useState } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { MotionLi } from "@/components/ui/motion";
import { Course, Teacher } from "@/types";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
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
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { useScheduleStore } from "@/lib/store";

import CourseItemBody from "./body";
import CourseDialogContent from "./course-dialog-content";

interface CourseItemProps {
  index: number;
  course: Course;
  courseTeachers: Teacher[];
}

const CourseItem = function CourseItem({
  index,
  course,
  courseTeachers,
}: CourseItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showLastCourseAlert, setShowLastCourseAlert] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTimetableId = useScheduleStore((state) => state.activeTimetableId);
  const timetables = useScheduleStore((state) => state.timetables);
  const setCourseSlots = useScheduleStore((state) => state.setCourseSlots);
  const removeCourse = useScheduleStore((state) => state.removeCourse);
  const roomRole = useScheduleStore((state) => state.roomRole);

  const activeTimetable = timetables.find((t) => t.id === activeTimetableId);
  
  const selectedTeachersForCourse = activeTimetable?.selectedTeachers.filter((teacher) =>
    courseTeachers.some((ct) => ct.id === teacher.id)
  ) || [];
  const isAddedToTT = selectedTeachersForCourse.length > 0;

  const handleRemoveCourse = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const currentCourses = searchParams?.get("courses")?.split(",") || [];
    if (currentCourses.length === 1) {
      setShowLastCourseAlert(true);
      return;
    }
    
    executeDropCourse();
  };

  const executeDropCourse = () => {
    const currentCourses = searchParams?.get("courses")?.split(",") || [];
    const newCourses = currentCourses.filter((id) => id !== course.id);
    if (newCourses.length > 0) {
      router.replace(`?courses=${newCourses.join(",")}`);
    } else {
      removeCourse(course.id);
      const pathname = typeof window !== "undefined" ? window.location.pathname : "/planner";
      router.replace(pathname); // Stay on current page, just clear params
    }
  };

  const handleRemoveFromTT = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeTimetableId && isAddedToTT) {
      setCourseSlots(course.id, []);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <MotionLi
        layout
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ duration: 0.2, delay: index * 0.05 }}
        className={`group relative flex flex-col p-5 rounded-2xl border transition-all duration-300 w-full min-h-[160px] ${
          isAddedToTT 
            ? 'bg-gradient-to-br from-purple-500/10 to-blue-500/5 border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.1)]' 
            : 'bg-card hover:bg-muted/30 border-border hover:border-primary/30 shadow-sm hover:shadow-md'
        }`}
      >
        {isAddedToTT && (
          <div className="absolute -top-3 -right-3 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/40 border-2 border-background z-10">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-white">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
        )}

        <div className="flex-1">
          <div className="flex justify-between items-start mb-2">
            <h3 className={`font-extrabold text-xl tracking-tight ${isAddedToTT ? 'bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent' : 'text-foreground'}`}>
              {course.code}
            </h3>
            <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-primary/10 text-primary border border-primary/20">
              {course.credits} Credits
            </span>
          </div>
          <p className="text-sm font-medium text-muted-foreground mt-1 line-clamp-2 leading-relaxed" title={course.name}>
            {course.name}
          </p>
        </div>

        <div className="flex gap-3 mt-5 pt-4 border-t border-border/50">
          {!isAddedToTT ? (
            <>
              <DialogTrigger asChild>
                <Button 
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl shadow-md shadow-purple-500/20 border-0 transition-all group-hover:shadow-purple-500/40" 
                  size="sm"
                  disabled={roomRole === "spectator"}
                >
                  Add to TT
                </Button>
              </DialogTrigger>
              <Button 
                className="flex-1 rounded-xl border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white transition-colors" 
                size="sm" 
                variant="outline" 
                onClick={handleRemoveCourse}
                disabled={roomRole === "spectator"}
              >
                Drop Course
              </Button>
            </>
          ) : (
            <>
              <DialogTrigger asChild>
                <Button 
                  className="flex-1 rounded-xl bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 hover:text-purple-300 border border-purple-500/30 transition-colors" 
                  size="sm" 
                  variant="outline"
                  disabled={roomRole === "spectator"}
                >
                  Modify Slots
                </Button>
              </DialogTrigger>
              <Button 
                className="flex-1 rounded-xl border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white transition-colors" 
                size="sm" 
                variant="outline" 
                onClick={handleRemoveFromTT}
                disabled={roomRole === "spectator"}
              >
                Remove from TT
              </Button>
            </>
          )}
        </div>

        <DialogContent className="p-0 border border-border/50 overflow-hidden bg-background/95 backdrop-blur-xl sm:max-w-4xl max-h-[90vh] flex flex-col rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.15)] dark:shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          <VisuallyHidden>
            <DialogTitle>Select Slots for {course.code}</DialogTitle>
          </VisuallyHidden>
          
          <CourseDialogContent course={course} />
          
          <div className="flex-1 overflow-y-auto min-h-0">
            <CourseItemBody
              course={course}
              isExpanded={isOpen}
              courseTeachers={courseTeachers}
              onClose={() => setIsOpen(false)}
            />
          </div>
        </DialogContent>
      </MotionLi>

      <AlertDialog open={showLastCourseAlert} onOpenChange={setShowLastCourseAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Drop last course?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to drop your last course. This will clear your planner. Do you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.stopPropagation();
                executeDropCourse();
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Drop Course
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};

export default CourseItem;
