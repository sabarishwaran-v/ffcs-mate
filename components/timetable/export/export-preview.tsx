"use client";

import { useState, useEffect } from "react";
import { CoursesTable } from "@/components/custom-ui/course-table";
import { useTimetableRenderData } from "@/hooks/useTimetableRenderData";

import { Timetable } from "../timetable";
import { ExportTimetableHeader } from "../ui/timetable-header";
import { useFeatureFlags } from "@/lib/store";

export function ExportPreview() {
  const hookOptimization = useFeatureFlags((state) =>
    state.isEnabled("hookOptimization")
  );
  const { totalCredits } = useTimetableRenderData(hookOptimization);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <div className="w-[1100px] bg-background p-8 rounded-xl flex flex-col gap-6 mx-auto">
      <ExportTimetableHeader totalCredits={totalCredits} />
      <Timetable hideControls={true} />
      <CoursesTable totalCredits={totalCredits} />

      <div className="mt-4 text-center text-xs text-muted-foreground">
        <p>Generated with FFCS MATE</p>
      </div>
    </div>
  );
}
