"use client";

import { useMemo, useState, useEffect } from "react";

import {
  AnimatePresenceWrapper,
  fadeIn,
  MotionDiv,
  MotionTr,
  ScrollAnimation,
  slideInFromBottom,
} from "@/components/ui/motion";
import { useTotalCredits } from "@/hooks/useTotalCredits";
import { useScheduleStore, useFeatureFlags } from "@/lib/store";
import { cn } from "@/lib/utils";
import { getCreditsFromSlotString } from "@/lib/ltpjc-parser";

import { IconButton } from "./ui/icon-button";

export function SelectedCoursesTable() {
  const { courses, toggleTeacherInTimetable, getSelectedTeachers } =
    useScheduleStore();

  const enableOptimizations = useFeatureFlags((state) =>
    state.isEnabled("newOptimizations")
  );
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const totalCredits = useTotalCredits();

  const courseMap = useMemo(
    () => new Map(courses.map((c) => [c.id, c])),
    [courses]
  );

  const sortedTeachers = getSelectedTeachers().sort((a, b) => {
    const courseA = enableOptimizations
      ? courseMap.get(a.course)
      : courses.find((c) => c.id === a.course);
    const courseB = enableOptimizations
      ? courseMap.get(b.course)
      : courses.find((c) => c.id === b.course);
    return (courseA?.name || "").localeCompare(courseB?.name || "");
  });

  if (!isMounted) return null;

  return (
    <ScrollAnimation animation="slideUp" threshold={0.1} duration={0.6}>
      <AnimatePresenceWrapper mode="wait">
        {sortedTeachers.length === 0 ? (
          <MotionDiv
            key="no-courses"
            className="p-4 text-center border rounded-lg text-muted-foreground"
            {...fadeIn}
            transition={{ duration: 0.3 }}
          >
            No courses selected. Add courses to your timetable to see them here.
          </MotionDiv>
        ) : (
          <MotionDiv
            key="courses-table"
            className="overflow-x-auto rounded-lg shadow-sm"
            {...slideInFromBottom}
            transition={{ duration: 0.4 }}
          >
            <table className="w-full overflow-hidden border border-collapse divide-gray-200 rounded-lg dark:divide-gray-700">
              <thead className="p-2 font-bold text-center bg-gray-100 select-none dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider uppercase text-start">
                    Course
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider uppercase">
                    Code
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider uppercase">
                    Credits
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider uppercase">
                    Slots
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider uppercase">
                    Faculty
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider uppercase">
                    Venue
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="p-2 font-bold text-center bg-gray-100 border dark:bg-gray-900">
                <AnimatePresenceWrapper>
                  {sortedTeachers.map((teacher, index) => {
                    const course = enableOptimizations
                      ? courseMap.get(teacher.course)
                      : courses.find((c) => c.id === teacher.course);
                    return (
                      <MotionTr
                        key={teacher.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 30,
                          delay: index * 0.05, // Staggered animation
                        }}
                        whileHover={{
                          backgroundColor: "rgba(0, 0, 0, 0.02)",
                          transition: { duration: 0.2 },
                        }}
                      >
                        <td className="px-6 py-4 text-sm font-medium text-start whitespace-nowrap">
                          {course?.name}
                        </td>
                        <td className="px-6 py-4 text-sm whitespace-nowrap">
                          {course?.code}
                        </td>
                        <td className="px-6 py-4 text-sm whitespace-nowrap">
                          {getCreditsFromSlotString(teacher.name, course)}
                        </td>
                        <td className="px-6 py-4 text-sm whitespace-nowrap">
                          {teacher.name}
                        </td>
                        <td className="px-6 py-4 text-sm whitespace-nowrap"></td>
                        <td className="px-6 py-4 text-sm whitespace-nowrap">
                          <div className="space-y-1">
                            {teacher.venue.morning && (
                              <div>M: {teacher.venue.morning}</div>
                            )}
                            {teacher.venue.afternoon && (
                              <div>A: {teacher.venue.afternoon}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm whitespace-nowrap">
                          <IconButton
                            icon="delete"
                            variant="red"
                            size="sm"
                            useAnimation={false}
                            onClick={() => toggleTeacherInTimetable(teacher.id)}
                          ></IconButton>
                        </td>
                      </MotionTr>
                    );
                  })}
                </AnimatePresenceWrapper>
              </tbody>
              <tfoot className="p-2 font-bold text-center bg-gray-100 border dark:bg-gray-900">
                <tr>
                  <td
                    colSpan={2}
                    className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap"
                  >
                    Total Credits:
                  </td>
                  <td className="px-6 py-4 text-sm font-bold whitespace-nowrap">
                    {totalCredits}
                  </td>
                  <td colSpan={2}></td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </MotionDiv>
        )}
      </AnimatePresenceWrapper>
    </ScrollAnimation>
  );
}
