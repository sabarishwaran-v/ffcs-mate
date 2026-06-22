"use client";

import { useMemo } from "react";

import { MotionLi } from "@/components/ui/motion";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { getAllSlots, isAfternoonTheory } from "@/src/utils/timetable";
import { Teacher } from "@/types";

import TeacherItemActions from "./actions";
import TeacherSlots from "./slots";
import TeacherClashTooltip from "./tooltip";

interface TeacherItemProps {
  index: number;
  className?: string;
  teacher: Teacher;
  isSelected: boolean;
  hasSameSlotClash: boolean;
  clashedTeachers: Teacher[];
}

export default function TeacherItem({
  teacher,
  clashedTeachers,
  className,
  isSelected,
  index,
  hasSameSlotClash,
}: TeacherItemProps) {
  const hasClash = clashedTeachers.length > 0;
  const identicalSlotClash = hasSameSlotClash && !(clashedTeachers.length > 1);

  const teacherNameEnh = useMemo(() => {
    const mergedSlots = getAllSlots(teacher);
    if (mergedSlots.length > 0) {
      if (isAfternoonTheory(mergedSlots[0])) {
        return `${teacher.name} (E)`;
      }
      return teacher.name;
    }
  }, [teacher]);

  const teacherSlots = useMemo(() => {
    return getAllSlots(teacher);
  }, [teacher]);

  return (
    <TooltipProvider>
      <MotionLi
        className={cn(
          "p-3 rounded-lg border flex justify-between items-center gap-2",
          identicalSlotClash
            ? "bg-yellow-ui"
            : hasClash
              ? "bg-red-ui"
              : `bg-${teacher.color}-ui`,
        )}
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
        layout
      >
        <div className={className}>
          <div className="flex items-center gap-2">
            <p className="font-medium">{teacherNameEnh}</p>
            <TeacherClashTooltip
              clashedTeachers={clashedTeachers}
              identicalSlotClash={identicalSlotClash}
            />
          </div>
          {(teacher.venue.morning || teacher.venue.afternoon) && (
            <p className="text-xs text-muted-foreground">
              Venue:{" "}
              {[
                teacher.venue.morning && `M: ${teacher.venue.morning}`,
                teacher.venue.afternoon && `A: ${teacher.venue.afternoon}`,
              ]
                .filter(Boolean)
                .map((venue, index) => (
                  <span key={index} className="font-medium">
                    {index > 0 && " | "}
                    {venue}
                  </span>
                ))}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <TeacherSlots slots={teacherSlots} color={teacher.color} />
          <TeacherItemActions
            teacher={teacher}
            isSelected={isSelected}
            hasClash={hasClash}
          />
        </div>
      </MotionLi>
    </TooltipProvider>
  );
}
