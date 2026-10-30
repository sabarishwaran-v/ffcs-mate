"use client";

import { memo, useCallback, useMemo, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

import { CourseList } from "@/components/course-preference/list/course-list";
import { AnimatedButton } from "@/components/ui/button";
import { MotionDiv } from "@/components/ui/motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useScheduleStore } from "@/lib/store";
import { Course, Teacher } from "@/types";
import { MOCK_COURSES } from "@/lib/mock-data";
import facultyData from "@/lib/faculties.json";
import { CourseSortMenu } from "@/components/course-preference/ui/sort-menu";
import { CourseSelectionModal } from "./course-selection-modal";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Separator } from "../ui/separator";

export function CoursePreference() {
  const searchParams = useSearchParams();
  const courseIds = searchParams?.get("courses");
  const { activeTimetableId, getActiveTimetable } = useScheduleStore();
  const { courses, addCourse, teachers, addTeachers } = useScheduleStore();
  const [sortBy, setSortBy] = useState<"code" | "name">("code");

  useEffect(() => {
    const activeRoomId = useScheduleStore.getState().activeRoomId;
    
    // If no course query param is provided, it means we navigated directly to the planner.
    // We should NOT wipe the Zustand state! Just use the existing state.
    if (courseIds === null) {
      return;
    }

    // In Collaborative Mode, do not let an empty URL wipe the cloud-synced courses
    if (activeRoomId && !courseIds) {
      return;
    }

    // If courseIds is empty string (though Proceed button prevents this), ids should be empty
    const ids = courseIds ? courseIds.split(",") : [];
    const state = useScheduleStore.getState();
    const currentCourseIds = state.courses.map(c => c.id);

    // Remove any course that is currently in the planner but no longer in the basket selection
    const toRemove = currentCourseIds.filter(id => !ids.includes(id));
    toRemove.forEach(id => {
      useScheduleStore.getState().removeCourse(id);
    });

    const currentCourses = useScheduleStore.getState().courses;
    const currentTeachers = useScheduleStore.getState().teachers;
    const typedFacultyData = facultyData as Record<string, { faculty: string, venue: string }[]>;
    const newTeachersToAdd: Parameters<typeof addTeachers>[0] = [];

    MOCK_COURSES.forEach(mockData => {
      // If course is selected (present in URL)
      if (ids.includes(mockData.id)) {
        if (!currentCourses.find(c => c.id === mockData.id)) {
          useScheduleStore.getState().addCourse({
            id: mockData.id,
            code: mockData.code,
            name: mockData.title,
            credits: mockData.credits,
            type: mockData.type,
            theorySlots: mockData.theorySlots,
            labSlots: mockData.labSlots,
          });
        }

        const allSlots = [...(mockData.theorySlots || []), ...(mockData.labSlots || [])];
        const hasKnownFacultiesInJson = allSlots.some(slotStr => {
          const facultyKey = `${mockData.code}_${slotStr}`;
          return typedFacultyData[facultyKey] && typedFacultyData[facultyKey].length > 0;
        });

        // Filter out any stale teachers from previous semesters that are not custom uploads
        const staleTeachersToRemove = currentTeachers.filter(
          t => t.course === mockData.id &&
               t.faculty &&
               t.faculty !== "-" &&
               t.addedByName !== "Custom HTML Upload" &&
               !hasKnownFacultiesInJson
        );
        if (staleTeachersToRemove.length > 0) {
          useScheduleStore.getState().removeTeachers(staleTeachersToRemove.map(t => t.id));
        }

        const freshCourseTeachers = useScheduleStore.getState().teachers.filter(t => t.course === mockData.id);
        const existingRealTeachers = freshCourseTeachers.filter(
          t => t.faculty && t.faculty !== "-"
        );

        // If no real teachers loaded yet, populate from faculties.json
        if (existingRealTeachers.length === 0 && freshCourseTeachers.length === 0) {
          const uniqueSlotsCount = allSlots.reduce((acc, slot) => {
            acc[slot] = (acc[slot] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);

          allSlots.forEach((slotStr, index) => {
            const hasDuplicates = uniqueSlotsCount[slotStr] > 1;
            const parsedPeriods = slotStr.split('+').map(s => s.trim());
            const isLab = parsedPeriods.some(s => s.startsWith('L') && /[0-9]/.test(s));
            
            const facultyKey = `${mockData.code}_${slotStr}`;
            const faculties = typedFacultyData[facultyKey];
            
            if (faculties && faculties.length > 0) {
              faculties.forEach((fac, fIndex) => {
                const fakeTeacherId = `${mockData.id}-${slotStr}-f${fIndex}`;
                newTeachersToAdd.push({
                  id: fakeTeacherId,
                  name: slotStr, 
                  faculty: fac.faculty,
                  color: isLab ? "#0ea5e9" : "#8b5cf6",
                  slots: { morning: parsedPeriods, afternoon: null },
                  venue: { morning: fac.venue || null, afternoon: null },
                  course: mockData.id,
                });
              });
            } else {
              const fakeTeacherId = hasDuplicates ? `${mockData.id}-${slotStr}-${index}` : `${mockData.id}-${slotStr}`;
              const facultyName = hasDuplicates ? `Faculty ${index}` : undefined;
    
              newTeachersToAdd.push({
                id: fakeTeacherId,
                name: slotStr, 
                faculty: facultyName,
                color: isLab ? "#0ea5e9" : "#8b5cf6",
                slots: { morning: parsedPeriods, afternoon: null },
                venue: { morning: null, afternoon: null },
                course: mockData.id,
              });
            }
          });
        }
      }
    });

    if (newTeachersToAdd.length > 0) {
      // Clean up any placeholder "-" teachers for courses being updated with real data
      const coursesBeingAdded = new Set(newTeachersToAdd.map(t => t.course));
      const placeholderIdsToRemove = currentTeachers
        .filter(t => coursesBeingAdded.has(t.course) && (!t.faculty || t.faculty === "-"))
        .map(t => t.id);

      if (placeholderIdsToRemove.length > 0) {
        useScheduleStore.getState().removeTeachers(placeholderIdsToRemove);
      }

      useScheduleStore.getState().addTeachers(newTeachersToAdd);
    }
  }, [courseIds]);

  return (
    <Card className="container m-3 mx-auto">
      <CardHeader className="flex flex-wrap items-center justify-between border-b pb-4 flex-row">
        <CardTitle className="text-xl mt-1.5">Your Courses</CardTitle>
        <CoursePreferenceHeaderActions 
          sortBy={sortBy} 
          onSortChange={setSortBy} 
          totalCourses={courses.length} 
          courseIdsString={courses.map(c => c.id).join(",")}
        />
      </CardHeader>
      <CoursePreferenceContent sortBy={sortBy} />
    </Card>
  );
}

const CoursePreferenceHeaderActions = memo(({ 
  sortBy, 
  onSortChange, 
  totalCourses,
  courseIdsString
}: { 
  sortBy: "code" | "name"; 
  onSortChange: (value: "code" | "name") => void; 
  totalCourses: number; 
  courseIdsString: string;
}) => {
  const pathname = typeof window !== "undefined" ? window.location.pathname : "";
  const roomRole = useScheduleStore(state => state.roomRole);
  const activeSemester = useScheduleStore(state => state.activeSemester) || "";
  
  let href = `/select-courses?semester=${activeSemester}`;
  if (courseIdsString) {
    href += `&courses=${courseIdsString}`;
  }
  
  const isRoom = pathname && pathname.startsWith("/room/");
  if (isRoom) {
    const roomId = pathname.split("/")[2];
    href += `&roomId=${roomId}`;
  }

  const no8amRule = useScheduleStore(state => state.no8amRule);
  const setNo8amRule = useScheduleStore(state => state.setNo8amRule);

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <div className="flex items-center space-x-2 bg-secondary/50 px-3 py-1.5 rounded-md border">
        <Switch 
          id="no-8am-rule" 
          checked={no8amRule} 
          onCheckedChange={setNo8amRule}
        />
        <Label htmlFor="no-8am-rule" className="cursor-pointer text-sm font-semibold">No 8 AM Classes</Label>
      </div>

      {totalCourses > 1 && (
        <CourseSortMenu
          value={sortBy}
          onChange={(v) => onSortChange(v as "code" | "name")}
        />
      )}
      {totalCourses > 0 && (
        isRoom ? (
          roomRole === "spectator" ? (
            <AnimatedButton variant="outline" disabled className="bg-sky-600/10 text-sky-400 border-sky-500/30 opacity-50 cursor-not-allowed">
              Spectator Mode
            </AnimatedButton>
          ) : (
            <CourseSelectionModal />
          )
        ) : (
          <Link href={href} passHref>
            <AnimatedButton variant="outline" className="bg-sky-600/10 text-sky-400 hover:bg-sky-600/20 border-sky-500/30">
              Edit Course Selection
            </AnimatedButton>
          </Link>
        )
      )}
    </div>
  );
});
CoursePreferenceHeaderActions.displayName = "CoursePreferenceHeaderActions";

const CoursePreferenceContent = memo(({ sortBy }: { sortBy: "code" | "name" }) => {
  return (
    <CardContent className="min-h-[300px] p-0 pt-0">
      <MotionDiv
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <ScrollArea className="h-96">
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="px-4 pb-4"
          >
            <CourseList externalSortBy={sortBy} />
          </MotionDiv>
        </ScrollArea>
      </MotionDiv>
      <Separator className="mt-4" />
    </CardContent>
  );
});
CoursePreferenceContent.displayName = "CoursePreferenceContent";
