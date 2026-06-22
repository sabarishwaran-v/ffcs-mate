import { ChevronUpIcon, Trash2 } from "lucide-react";
import { useCallback } from "react";

import { AnimatedButton } from "@/components/ui/button";
import { useScheduleStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Course } from "@/types";

interface CourseItemActionsProps {
  course: Course;
  isExpanded: boolean;
}

export default function CourseItemActions({
  course,
  isExpanded,
}: CourseItemActionsProps) {
  const removeCourse = useScheduleStore((state) => state.removeCourse);

  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent expanding the accordion when clicking delete
    removeCourse(course.id);
  }, [course.id, removeCourse]);

  return (
    <>
      <AnimatedButton
        variant="ghost"
        size="icon"
        onClick={handleRemove}
        aria-label="Remove course"
        className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
      >
        <Trash2 className="w-4 h-4" />
      </AnimatedButton>
      <AnimatedButton
        variant="ghost"
        size="icon"
        aria-label={isExpanded ? "Collapse slots" : "Expand slots"}
        className="transition-transform duration-200"
      >
        <ChevronUpIcon
          className={cn("w-4 h-4 transition-transform", {
            "rotate-180": !isExpanded,
          })}
        />
      </AnimatedButton>
    </>
  );
}
