import { useMemo } from "react";

import { Course, Teacher } from "@/types";

export function useFilteredCourses(
  courses: Course[],
  searchQuery: string,
  sortBy: "code" | "name",
) {
  return useMemo(() => {
    const search = searchQuery.toLowerCase();

    const filtered = courses.filter(
      (course) =>
        course.code.toLowerCase().includes(search) ||
        course.name.toLowerCase().includes(search),
    );

    return filtered.sort((a, b) =>
      sortBy === "code"
        ? a.code.localeCompare(b.code)
        : a.name.localeCompare(b.name),
    );
  }, [courses, searchQuery, sortBy]);
}

export function useTeachersForCourse(teachers: Teacher[]) {
  return (courseId: string) => teachers.filter((t) => t.course === courseId);
}
