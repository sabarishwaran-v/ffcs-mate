import { StateCreator } from "zustand";
import { StoreState } from "../types";

export type CourseSlice = Pick<
  StoreState,
  "courses" | "getCourse" | "addCourse" | "editCourse" | "removeCourse"
>;

export const createCourseSlice: StateCreator<
  StoreState,
  [],
  [],
  CourseSlice
> = (set, get) => ({
  courses: [],

  getCourse: (id) => get().courses.find((c) => c.id === id),

  addCourse: (course) =>
    set((state) => {
      // Prevent duplicate courses
      if (course.id && state.courses.some((c) => c.id === course.id)) {
        return state;
      }
      return {
        courses: [...state.courses, { ...course, id: course.id || crypto.randomUUID() }],
      };
    }),

  editCourse: (id, updates) =>
    set((state) => ({
      courses: state.courses.map((c) =>
        c.id === id ? { ...c, ...updates } : c,
      ),
    })),

  removeCourse: (id) =>
    set((state) => {
      const newTimetables = state.timetables.map((timetable) => ({
        ...timetable,
        selectedTeachers: timetable.selectedTeachers.filter(
          (t) => t.course !== id,
        ),
        selectedSlots: Array.from(
          new Set(
            timetable.selectedTeachers
              .filter((t) => t.course !== id)
              .flatMap((t) => [
                ...(t.slots.morning || []),
                ...(t.slots.afternoon || []),
              ]),
          ),
        ),
      }));

      return {
        courses: state.courses.filter((c) => c.id !== id),
        teachers: state.teachers.filter((t) => t.course !== id),
        timetables: newTimetables,
      };
    }),
});
