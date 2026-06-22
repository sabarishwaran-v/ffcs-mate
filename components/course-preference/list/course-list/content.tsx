import EmptyState from "@/components/empty-state";
import Link from "next/link";
import { AnimatedButton } from "@/components/ui/button";
import { CourseSelectionModal } from "../../course-selection-modal";
import { useScheduleStore } from "@/lib/store";
import { AnimatePresenceWrapper, MotionUl } from "@/components/ui/motion";
import {
  useFilteredCourses,
  useTeachersForCourse,
} from "@/src/hooks/useFilteredCourses";
import { Course, Teacher } from "@/types";

import CourseItem from "../../items/course-item/course-item";

interface Props {
  courses: Course[];
  teachers: Teacher[];
  sortBy: "code" | "name";
  searchQuery: string;
}

export function CourseListContent({
  courses,
  teachers,
  sortBy,
  searchQuery,
}: Props) {
  const filteredCourses = useFilteredCourses(courses, searchQuery, sortBy);
  const getTeachersForCourse = useTeachersForCourse(teachers);
  const roomRole = useScheduleStore((state) => state.roomRole);

  if (courses.length === 0) {
    const pathname =
      typeof window !== "undefined" ? window.location.pathname : "";
    const isRoom = pathname && pathname.startsWith("/room/");
    let href = "/select-courses";
    if (isRoom) {
      const roomId = pathname.split("/")[2];
      href += `?roomId=${roomId}`;
    }

    return (
      <EmptyState
        text="No courses added yet. Add your first course!"
        animationKey="no-courses"
      >
        {isRoom ? (
          roomRole === "spectator" ? (
            <AnimatedButton
              variant="outline"
              disabled
              className="bg-sky-600/10 text-sky-400 border-sky-500/30 opacity-50 cursor-not-allowed"
            >
              Spectator Mode
            </AnimatedButton>
          ) : (
            <CourseSelectionModal />
          )
        ) : (
          <Link href={href} passHref>
            <AnimatedButton
              variant="outline"
              className="bg-sky-600/10 text-sky-400 hover:bg-sky-600/20 border-sky-500/30"
            >
              Add Courses
            </AnimatedButton>
          </Link>
        )}
      </EmptyState>
    );
  }

  if (filteredCourses.length === 0) {
    return (
      <EmptyState
        text="No courses match your search."
        animationKey="no-results"
      />
    );
  }

  const uniqueFilteredCourses = Array.from(
    new Map(filteredCourses.map((course) => [course.id, course])).values()
  );

  return (
    <AnimatePresenceWrapper>
      <MotionUl
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        layout
      >
        {uniqueFilteredCourses.map((course, index) => (
          <CourseItem
            key={course.id}
            index={index}
            course={course}
            courseTeachers={getTeachersForCourse(course.id)}
          />
        ))}
      </MotionUl>
    </AnimatePresenceWrapper>
  );
}
