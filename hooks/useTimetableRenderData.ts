"use client";

import { useMemo } from "react";

import { manualSlotSelectionStore, useScheduleStore } from "@/lib/store";
import { days, timetableData } from "@/src/constants/timetable";
import { getDaysForSlot, hasClashUsingMap } from "@/src/utils/clash-detection";
import { getAllSlots, getVenueForSlot } from "@/src/utils/timetable";
import type { CellRenderData, Teacher, TimetableRenderData } from "@/types";

import { useTotalCredits } from "./useTotalCredits";

export function useTimetableRenderData(
  hookOptimization: boolean = false
): TimetableRenderData {
  const { getSelectedTeachers, courses, getAllClashesEnhanced } =
    useScheduleStore();
  const { manualSelectedSlots } = manualSlotSelectionStore();
  const totalCredits = useTotalCredits();
  const selectedTeachers = getSelectedTeachers();

  // Memoize all clashes
  const allClashes = useMemo(
    () => getAllClashesEnhanced(selectedTeachers),
    [getAllClashesEnhanced, selectedTeachers]
  );
  const allClashesCount = allClashes.length;

  const baseCellsData = useMemo(() => {
    if (!hookOptimization) return null;

    // Create a map for quick course code lookups
    const courseCodeMap = new Map(courses.map((c) => [c.id, c.code]));

    // Build a map of slot -> teachers occupying it for each day
    const slotOccupancyMap = buildSlotOccupancyMap(selectedTeachers);

    // Pre-calculate clash details for all cells
    const precomputedClashDetails = calculateClashDetails(
      selectedTeachers,
      slotOccupancyMap,
      courseCodeMap
    );

    // Generate the base cell data for rendering
    return generateCellsData(
      courseCodeMap,
      slotOccupancyMap,
      precomputedClashDetails
    );
  }, [selectedTeachers, courses, hookOptimization]);

  const cellsData = useMemo(() => {
    if (hookOptimization && baseCellsData) {
      if (manualSelectedSlots.length === 0) return baseCellsData;

      const isSlotSelected = new Set(manualSelectedSlots);
      const finalCells: Record<string, Record<string, CellRenderData>> = {};

      for (const day of days) {
        finalCells[day] = {};
        for (const timePeriodSlots of timetableData[day]) {
          const slotKey = timePeriodSlots.join("/");
          const baseCell = baseCellsData[day][slotKey];

          finalCells[day][slotKey] = {
            ...baseCell,
            isSelectedManual: timePeriodSlots.some((s) =>
              isSlotSelected.has(s)
            ),
          };
        }
      }

      return finalCells;
    } else {
      const courseCodeMap = new Map(courses.map((c) => [c.id, c.code]));
      const slotOccupancyMap = buildSlotOccupancyMap(selectedTeachers);
      const precomputedClashDetails = calculateClashDetails(
        selectedTeachers,
        slotOccupancyMap,
        courseCodeMap
      );

      return generateCellsData(
        courseCodeMap,
        slotOccupancyMap,
        precomputedClashDetails,
        manualSelectedSlots
      );
    }
  }, [
    selectedTeachers,
    courses,
    manualSelectedSlots,
    hookOptimization,
    baseCellsData,
  ]);

  return {
    cellsData,
    totalCredits,
    allClashesCount,
    manualSelectedSlots,
  };
}

// Helper function to build the slot occupancy map
function buildSlotOccupancyMap(teachers: Teacher[]) {
  const slotOccupancyMap = new Map<
    string,
    { teacher: Teacher; day: string }[]
  >();

  teachers.forEach((teacher) => {
    const allSlots = getAllSlots(teacher);

    allSlots.forEach((slot) => {
      getDaysForSlot(slot).forEach((day) => {
        const key = `${day}-${slot}`;
        if (!slotOccupancyMap.has(key)) {
          slotOccupancyMap.set(key, []);
        }
        slotOccupancyMap.get(key)!.push({ teacher, day });
      });
    });
  });

  return slotOccupancyMap;
}

// Helper function to calculate clash details for all cells
function calculateClashDetails(
  teachers: Teacher[],
  slotOccupancyMap: Map<string, { teacher: Teacher; day: string }[]>,
  courseCodeMap: Map<string, string>
) {
  const clashDetails: Record<string, { courses: string[] } | null> = {};

  for (const day of days) {
    for (const timePeriodSlots of timetableData[day]) {
      for (const currentSlot of timePeriodSlots) {
        const cellKey = `${day}-${currentSlot}`;
        const currentSlotTeachers = slotOccupancyMap.get(cellKey) || [];

        if (currentSlotTeachers.length > 1) {
          clashDetails[cellKey] = getDirectClashDetails(
            currentSlotTeachers,
            courseCodeMap
          );
        } else if (currentSlotTeachers.length === 1) {
          const mainTeacher = currentSlotTeachers[0].teacher;
          const crossSlotClash = getCrossSlotClashDetails(
            mainTeacher,
            teachers,
            day,
            courseCodeMap,
            currentSlot
          );

          if (crossSlotClash) {
            clashDetails[cellKey] = crossSlotClash;
          }
        }
      }
    }
  }

  return clashDetails;
}

// Helper function to get direct clash details (multiple teachers in same slot)
function getDirectClashDetails(
  slotTeachers: { teacher: Teacher; day: string }[],
  courseCodeMap: Map<string, string>
) {
  const clashingCourseCodes: string[] = [];
  const processedTeacherIds = new Set<string>();

  for (const { teacher } of slotTeachers) {
    if (!processedTeacherIds.has(teacher.id)) {
      const courseCode = courseCodeMap.get(teacher.course) || "Unknown";
      clashingCourseCodes.push(`${courseCode} (${teacher.name})`);
      processedTeacherIds.add(teacher.id);
    }
  }

  return {
    courses: [...new Set(clashingCourseCodes)].sort(),
  };
}

// Helper function to check for cross-slot clashes
function getCrossSlotClashDetails(
  mainTeacher: Teacher,
  allTeachers: Teacher[],
  day: string,
  courseCodeMap: Map<string, string>,
  currentSlot: string = ""
) {
  const clashingCourseCodes: string[] = [];
  const processedTeacherIds = new Set<string>();
  let hasAddedMainTeacher = false;

  for (const otherTeacher of allTeachers) {
    if (mainTeacher.id === otherTeacher.id) continue;

    const clashingSlots = hasClashUsingMap(mainTeacher, otherTeacher);

    if (
      clashingSlots.length === 0 ||
      (currentSlot && !clashingSlots.includes(currentSlot))
    ) {
      continue;
    }

    // Check if any of the clashing slots occur on the specified day
    const relevantClashesForDay = clashingSlots.filter((slot) =>
      getDaysForSlot(slot).includes(day)
    );

    if (relevantClashesForDay.length > 0) {
      // Add the other teacher's course
      if (!processedTeacherIds.has(otherTeacher.id)) {
        const otherCourseCode =
          courseCodeMap.get(otherTeacher.course) || "Unknown";
        clashingCourseCodes.push(`${otherCourseCode} (${otherTeacher.name})`);
        processedTeacherIds.add(otherTeacher.id);
      }

      // Add the main teacher's course (only once)
      if (!hasAddedMainTeacher) {
        const mainCourseCode =
          courseCodeMap.get(mainTeacher.course) || "Unknown";
        clashingCourseCodes.unshift(`${mainCourseCode} (${mainTeacher.name})`);
        hasAddedMainTeacher = true;
      }
    }
  }

  return clashingCourseCodes.length > 0
    ? { courses: [...new Set(clashingCourseCodes)].sort() }
    : null;
}

// Helper function to generate the base cells data for rendering
function generateCellsData(
  courseCodeMap: Map<string, string>,
  slotOccupancyMap: Map<string, { teacher: Teacher; day: string }[]>,
  clashDetails: Record<string, { courses: string[] } | null>,
  manualSelectedSlots: string[] = []
): Record<string, Record<string, CellRenderData>> {
  const cells: Record<string, Record<string, CellRenderData>> = {};

  const isSlotSelected = new Set(manualSelectedSlots);

  for (const day of days) {
    cells[day] = {};

    for (const timePeriodSlots of timetableData[day]) {
      const slotKey = timePeriodSlots.join("/");
      const [slotA, slotB] = timePeriodSlots;
      const teachersInCell = getTeachersInCell(
        day,
        timePeriodSlots,
        slotOccupancyMap
      );

      const clashKeyA = `${day}-${slotA}`;
      const clashKeyB = `${day}-${slotB}`;
      const clashInfo =
        clashDetails[clashKeyA] || clashDetails[clashKeyB] || null;

      if (teachersInCell.length === 0) {
        cells[day][slotKey] = {
          color:
            "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-800",
          teacherName: "",
          courseCode: "",
          venue: "",
          isClash: !!clashInfo,
          clashDetails: clashInfo,
          isSelectedManual: timePeriodSlots.some((s) => isSlotSelected.has(s)),
        };
        continue;
      }

      const displayTeacher = teachersInCell[0];
      const courseCode = courseCodeMap.get(displayTeacher.course) || "";
      const venue = findVenueForCell(displayTeacher, timePeriodSlots);
      const colorClass = `bg-${displayTeacher.color}-ui text-${displayTeacher.color}-dim`;

      cells[day][slotKey] = {
        color: colorClass,
        teacherName: displayTeacher.name,
        courseCode,
        venue,
        isClash: !!clashInfo,
        clashDetails: clashInfo,
        isSelectedManual: timePeriodSlots.some((s) => isSlotSelected.has(s)),
      };
    }
  }

  return cells;
}

// Helper function to get all teachers in a specific cell
function getTeachersInCell(
  day: string,
  slots: string[],
  slotOccupancyMap: Map<string, { teacher: Teacher; day: string }[]>
) {
  const teachersInCell: Teacher[] = [];
  const processedTeacherIds = new Set<string>();

  for (const slot of slots) {
    const slotTeachers = slotOccupancyMap.get(`${day}-${slot}`) || [];

    for (const { teacher } of slotTeachers) {
      if (!processedTeacherIds.has(teacher.id)) {
        teachersInCell.push(teacher);
        processedTeacherIds.add(teacher.id);
      }
    }
  }

  return teachersInCell;
}

// Helper function to find venue for a cell
function findVenueForCell(teacher: Teacher, slots: string[]): string {
  // Try to find venue for any slot in the cell
  for (const slot of slots) {
    const venue = getVenueForSlot(teacher, slot);
    if (venue) {
      return venue;
    }
  }
  return "";
}
