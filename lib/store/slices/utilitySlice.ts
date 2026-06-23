import { StateCreator } from "zustand";
import { toast } from "sonner";
import { StoreState } from "../types";
import { clearClashDetectionCaches, check8amClash } from "@/src/utils/clash-detection";

export type UtilitySlice = Pick<
  StoreState,
  "clearAll" | "clearClashCaches" | "activeSemester" | "setSemester" | "no8amRule" | "setNo8amRule"
>;

export const createUtilitySlice: StateCreator<
  StoreState,
  [],
  [],
  UtilitySlice
> = (set, get) => ({
  activeSemester: null,
  no8amRule: false,

  setNo8amRule: (val: boolean) => {
    set({ no8amRule: val });
    if (val) {
      const state = get();
      if (!state.activeTimetableId) return;
      const timetable = state.timetables.find((t) => t.id === state.activeTimetableId);
      if (!timetable) return;

      const removedCourseCodes: string[] = [];

      timetable.teachers.forEach((teacherId) => {
        const teacher = state.teachers.find((t) => t.id === teacherId);
        if (teacher) {
          const course = state.courses.find((c) => c.id === teacher.course);
          const courseCode = course?.code || "Unknown";
          const courseType = course?.type || undefined;
          
          if (check8amClash(teacher, courseCode, courseType)) {
            // Drop it using toggleTeacherInTimetable
            state.toggleTeacherInTimetable(teacher.id);
            removedCourseCodes.push(`${courseCode} (${teacher.type})`);
          }
        }
      });

      if (removedCourseCodes.length > 0) {
        toast.info(`Dropped 8 AM courses: ${removedCourseCodes.join(', ')}`);
      }
    }
  },

  setSemester: (semester: string | null) => {
    const current = get().activeSemester;
    if (semester !== current) {
      // Wipe data if semester changes
      set({
        activeSemester: semester,
        courses: [],
        teachers: [],
        timetables: [],
        activeTimetableId: null,
      });
      clearClashDetectionCaches();
    }
  },

  clearAll: () => {
    set({
      courses: [],
      teachers: [],
      timetables: [],
      activeTimetableId: null,
    });
    clearClashDetectionCaches();
  },

  clearClashCaches: () => {
    clearClashDetectionCaches();
  },
});
