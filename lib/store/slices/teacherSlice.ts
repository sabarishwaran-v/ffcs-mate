import { StateCreator } from "zustand";
import { StoreState } from "../types";
import { clearClashDetectionCaches } from "@/src/utils/clash-detection";
import { Teacher } from "@/types";

export type TeacherSlice = Pick<
  StoreState,
  | "teachers"
  | "addTeacher"
  | "editTeacher"
  | "removeTeacher"
  | "deleteAllTeachersForCourse"
>;

export const createTeacherSlice: StateCreator<
  StoreState,
  [],
  [],
  TeacherSlice
> = (set, get) => ({
  teachers: [],

  addTeacher: (teacher) =>
    set((state) => {
      // Prevent duplicate teachers
      if (teacher.id && state.teachers.some((t) => t.id === teacher.id)) {
        return state;
      }
      return {
        teachers: [
          ...state.teachers,
          {
            ...teacher,
            id: teacher.id || Math.random().toString(36).slice(2, 9),
          },
        ],
      };
    }),

  editTeacher: (id, updates) =>
    set((state) => {
      const updateFn = (t: Teacher) => (t.id === id ? { ...t, ...updates } : t);

      clearClashDetectionCaches();

      const newTimetables = state.timetables.map((timetable) => ({
        ...timetable,
        selectedTeachers: timetable.selectedTeachers.map(updateFn),
      }));

      return {
        teachers: state.teachers.map(updateFn),
        timetables: newTimetables,
      };
    }),

  removeTeacher: (id) =>
    set((state) => {
      clearClashDetectionCaches();

      const newTimetables = state.timetables.map((timetable) => {
        const newSelectedTeachers = timetable.selectedTeachers.filter(
          (t) => t.id !== id
        );
        return {
          ...timetable,
          selectedTeachers: newSelectedTeachers,
          selectedSlots: Array.from(
            new Set(
              newSelectedTeachers.flatMap((t) => [
                ...(t.slots.morning || []),
                ...(t.slots.afternoon || []),
              ])
            )
          ),
        };
      });

      return {
        teachers: state.teachers.filter((t) => t.id !== id),
        timetables: newTimetables,
      };
    }),

  deleteAllTeachersForCourse: (courseId) =>
    set((state) => {
      clearClashDetectionCaches();

      const newTimetables = state.timetables.map((timetable) => {
        const newSelectedTeachers = timetable.selectedTeachers.filter(
          (t) => t.course !== courseId
        );
        return {
          ...timetable,
          selectedTeachers: newSelectedTeachers,
          selectedSlots: Array.from(
            new Set(
              newSelectedTeachers.flatMap((t) => [
                ...(t.slots.morning || []),
                ...(t.slots.afternoon || []),
              ])
            )
          ),
        };
      });

      return {
        teachers: state.teachers.filter((t) => t.course !== courseId),
        timetables: newTimetables,
      };
    }),
});
