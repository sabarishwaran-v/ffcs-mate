"use client";

import { useState } from "react";

import { Course, Teacher } from "@/types";

import { TeacherListContent } from "./teacher-list/content";
import { TeacherFilters } from "./teacher-list/filters";
import { TeacherListHeader } from "./teacher-list/header";

interface TeacherListProps {
  courseTeachers: Teacher[];
  course: Course;
}

export default function TeacherList({
  courseTeachers,
  course,
}: TeacherListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [slotFilter, setSlotFilter] = useState<string>("");
  const [colorFilter, setColorFilter] = useState<string>("");

  return (
    <div className="p-4 border-t">
      <TeacherListHeader course={course} courseTeachers={courseTeachers} />

      {courseTeachers.length > 0 && (
        <TeacherFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          slotFilter={slotFilter}
          setSlotFilter={setSlotFilter}
          colorFilter={colorFilter}
          setColorFilter={setColorFilter}
          courseTeachers={courseTeachers}
        />
      )}

      <TeacherListContent
        courseTeachers={courseTeachers}
        searchQuery={searchQuery}
        slotFilter={slotFilter}
        colorFilter={colorFilter}
      />
    </div>
  );
}
