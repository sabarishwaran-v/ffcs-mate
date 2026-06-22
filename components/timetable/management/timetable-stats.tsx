"use client";

import { memo } from "react";

import { MotionDiv } from "@/components/ui/motion";
import { useScheduleStore } from "@/lib/store";
import { getCreditsFromSlotString } from "@/lib/ltpjc-parser";

interface TimetableStatsProps {
  timetableId: string | null;
}

export const TimetableStats = memo(function TimetableStats({
  timetableId,
}: TimetableStatsProps) {
  const { timetables, courses } = useScheduleStore();
  const activeTimetable = timetables.find((t) => t.id === timetableId);

  if (!activeTimetable) return null;

  return (
    <MotionDiv
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-2 text-sm text-muted-foreground"
    >
      Total available courses: {courses.length} | Selected in this timetable:{" "}
      {new Set(activeTimetable.selectedTeachers.map(t => t.course)).size} | Total credits:{" "}
      {activeTimetable.selectedTeachers.reduce((sum, teacher) => {
        const course = courses.find((c) => c.id === teacher.course);
        return sum + getCreditsFromSlotString(teacher.name, course);
      }, 0)}
    </MotionDiv>
  );
});
