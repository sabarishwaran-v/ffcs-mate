import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@/lib/firebase", () => ({
  auth: {},
  db: {},
}));

import { useScheduleStore } from "@/lib/store";
import { MOCK_COURSES } from "@/lib/mock-data";

describe("Direct Link & Active Semester Initialization", () => {
  beforeEach(() => {
    useScheduleStore.getState().clearAll();
  });

  it("defaults activeSemester to winter2026", () => {
    const semester = useScheduleStore.getState().activeSemester;
    expect(semester).toBe("winter2026");
  });

  it("contains all 25BCE courses for direct linking", () => {
    const directLinkCourseIds = [
      "STS2011",
      "MGT1040",
      "ECS2003",
      "MAT1010",
      "CSE2008",
      "CSE2007",
      "CSE1005",
      "CSE1022",
    ];

    const availableIds = new Set(MOCK_COURSES.map((c) => c.id));
    for (const id of directLinkCourseIds) {
      expect(availableIds.has(id)).toBe(true);
    }
  });

  it("can load direct link course batch into store without semester wiping", () => {
    const directLinkCourseIds = [
      "STS2011",
      "MGT1040",
      "ECS2003",
      "MAT1010",
      "CSE2008",
      "CSE2007",
      "CSE1005",
      "CSE1022",
    ];

    const store = useScheduleStore.getState();
    expect(store.activeSemester).toBe("winter2026");

    // Simulate CoursePreference populating the courses from URL query param
    directLinkCourseIds.forEach((id) => {
      const mock = MOCK_COURSES.find((c) => c.id === id);
      if (mock) {
        store.addCourse({
          id: mock.id,
          code: mock.code,
          name: mock.title,
          credits: mock.credits,
          type: mock.type,
          theorySlots: mock.theorySlots,
          labSlots: mock.labSlots,
        });
      }
    });

    const loadedCourses = useScheduleStore.getState().courses;
    expect(loadedCourses.length).toBe(8);
    expect(loadedCourses.map((c) => c.code)).toEqual([
      "STS2011",
      "MGT1040",
      "ECS2003",
      "MAT1010",
      "CSE2008",
      "CSE2007",
      "CSE1005",
      "CSE1022",
    ]);
  });

  it("contains all 25BEV (ECE VLSI) basket courses and verifies total credits", () => {
    const bevCourseIds = [
      "MAT1010",
      "STS2011",
      "MGT1040",
      "ECS2003",
      "ECE2003",
      "ECE2006",
      "ECE2016",
      "ECE3006",
    ];

    const availableIds = new Set(MOCK_COURSES.map((c) => c.id));
    for (const id of bevCourseIds) {
      expect(availableIds.has(id)).toBe(true);
    }

    const bevCourses = MOCK_COURSES.filter((c) => bevCourseIds.includes(c.id));
    const totalCredits = bevCourses.reduce((sum, c) => sum + (c.credits || 0), 0);
    // 4 + 1 + 4 + 2 + 4 + 4 + 4 + 4 = 27
    expect(totalCredits).toBe(27);
  });
});
