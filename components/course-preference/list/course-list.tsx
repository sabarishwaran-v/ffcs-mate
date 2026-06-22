"use client";

import { useState } from "react";

import { useScheduleStore } from "@/lib/store";

import { CourseListContent } from "./course-list/content";
import { CourseFilters } from "./course-list/filters";

export function CourseList({
  externalSortBy,
}: {
  externalSortBy?: "code" | "name";
}) {
  const { courses, teachers } = useScheduleStore();
  const [internalSortBy, setSortBy] = useState<"code" | "name">("code");
  const sortBy = externalSortBy || internalSortBy;
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div>
      {courses.length > 0 && (
        <CourseFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      )}

      <CourseListContent
        courses={courses}
        teachers={teachers}
        sortBy={sortBy}
        searchQuery={searchQuery}
      />
    </div>
  );
}
