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
        className="flex flex-col border rounded-md shadow-sm bg-card p-4 gap-3 h-full"
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 30,
          delay: index * 0.05,
        }}
        whileHover={{
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
          transition: { duration: 0.2 },
        }}
      >
        <div className="flex-1">
          <h3 className="font-bold text-lg">{course.code}</h3>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2" title={course.name}>{course.name}</p>
        </div>

        <div className="flex flex-wrap gap-2 mt-auto pt-2 border-t">
          {!isAddedToTT ? (
            <>
              <DialogTrigger asChild>
                <Button 
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" 
                  size="sm"
                  disabled={roomRole === "spectator"}
                >
                  Add to TT
                </Button>
              </DialogTrigger>
              <Button 
                className="flex-1 border-red-500/50 text-red-500 hover:bg-red-500/10 hover:text-red-500" 
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
                  className="flex-1" 
                  size="sm" 
                  variant="secondary"
                  disabled={roomRole === "spectator"}
                >
                  Modify
                </Button>
              </DialogTrigger>
              <Button 
                className="flex-1 border-red-500/50 text-red-500 hover:bg-red-500/10 hover:text-red-500" 
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

        <DialogContent className="p-0 border-0 overflow-hidden bg-[#0f172a] sm:max-w-4xl max-h-[90vh] flex flex-col">
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
