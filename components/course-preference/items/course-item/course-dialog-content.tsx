"use client";

import { Course } from "@/types";
import { parseLTPJC } from "@/lib/ltpjc-parser";

interface Props {
  course: Course;
}

const getCourseTypeString = (type?: string) => {
  if (!type) return "Theory";
  const t = type.toUpperCase();
  if (t === "TH") return "Theory";
  if (t === "LO") return "Lab";
  if (t === "ETL") return "Embedded Theory / Embedded Lab";
  if (t === "ETH") return "Embedded Theory";
  if (t === "ELA") return "Embedded Lab";
  if (t === "PJT") return "Project";
  if (t === "SS") return "Soft Skills";
  return type; // Fallback
};

export default function CourseDialogContent({ course }: Props) {
  const ltpjc = parseLTPJC(course);
  const typeStr = getCourseTypeString(course.type);

  return (
    <div className="bg-background/95 backdrop-blur-md p-4 sm:p-6 pb-4 shadow-sm z-10 border-b border-border flex-shrink-0">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
        {/* Left Side: Course Info */}
        <div className="flex-1">
          <h2 className="text-base sm:text-lg font-bold text-foreground leading-snug">
            {course.code} - {course.name}
          </h2>
          <p className="text-sm font-medium text-muted-foreground mt-1">
            {typeStr}
          </p>
        </div>

        {/* Right Side: Credits Box */}
        <div className="flex flex-col gap-1.5 shrink-0 bg-secondary/30 p-3 rounded-xl border border-border/50 shadow-inner w-full sm:w-auto">
          <div className="flex justify-between sm:w-48 text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider px-2">
            <span className="w-8 text-center">L</span>
            <span className="w-8 text-center">T</span>
            <span className="w-8 text-center">P</span>
            <span className="w-8 text-center">J</span>
            <span className="w-10 text-center">C</span>
          </div>
          <div className="flex justify-between sm:w-48 text-sm sm:text-base font-bold text-primary px-2">
            <span className="w-8 text-center">{ltpjc.L}</span>
            <span className="w-8 text-center">{ltpjc.T}</span>
            <span className="w-8 text-center">{ltpjc.P}</span>
            <span className="w-8 text-center">{ltpjc.J}</span>
            <span className="w-10 text-center">{ltpjc.C.toFixed(1)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
