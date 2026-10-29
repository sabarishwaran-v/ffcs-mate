import { StateCreator } from "zustand";
import { StoreState } from "../types";
import { clearClashDetectionCaches } from "@/src/utils/clash-detection";
import { getAllSlots } from "@/src/utils/timetable";
import { Teacher } from "@/types";

function normalizeTeacher(teacher: Omit<Teacher, "id"> & { id?: string }): Teacher {
  const normMorning = teacher.slots?.morning
    ? teacher.slots.morning.flatMap(s => (typeof s === "string" ? s.split("+").map(p => p.trim()) : [])).filter(Boolean)
    : null;
  const normAfternoon = teacher.slots?.afternoon
    ? teacher.slots.afternoon.flatMap(s => (typeof s === "string" ? s.split("+").map(p => p.trim()) : [])).filter(Boolean)
    : null;

  return {
    ...teacher,
    id: teacher.id || `${teacher.course || "course"}_${teacher.name || "slot"}_${Math.random().toString(36).slice(2, 9)}`,
    slots: {
      morning: normMorning,
      afternoon: normAfternoon,
    },
  };
}

export type TeacherSlice = Pick<
  StoreState,
  | "teachers"
  | "addTeacher"
  | "addTeachers"
  | "editTeacher"
  | "removeTeacher"
  | "removeTeachers"
  | "deleteAllTeachersForCourse"
  | "replaceCourseTeachers"
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
      // Prevent duplicate teachers by ID or matching content
      const isDuplicate = state.teachers.some((t) => {
        if (teacher.id && t.id === teacher.id) return true;
        if (
          teacher.course &&
          t.course === teacher.course &&
          t.name === teacher.name &&
          ((t.faculty || '').trim().toLowerCase() === (teacher.faculty || '').trim().toLowerCase()) &&
          ((t.venue?.morning || '') === (teacher.venue?.morning || '')) &&
          ((t.venue?.afternoon || '') === (teacher.venue?.afternoon || ''))
        ) {
          return true;
        }
        return false;
      });

      if (isDuplicate) {
        return state;
      }
      return {
        teachers: [
          ...state.teachers,
          normalizeTeacher(teacher),
        ],
      };
    }),

  addTeachers: (teachersToAdd) =>
    set((state) => {
      const currentTeachers = [...state.teachers];
      const newTeachers: Teacher[] = [];

      for (const t of teachersToAdd) {
        const isDuplicate = currentTeachers.some((existing) => {
          if (t.id && existing.id === t.id) return true;
          if (
            t.course &&
            existing.course === t.course &&
            existing.name === t.name &&
            ((existing.faculty || '').trim().toLowerCase() === (t.faculty || '').trim().toLowerCase()) &&
            ((existing.venue?.morning || '') === (t.venue?.morning || '')) &&
            ((existing.venue?.afternoon || '') === (t.venue?.afternoon || ''))
          ) {
            return true;
          }
          return false;
        });

        if (!isDuplicate) {
          const teacherWithId = normalizeTeacher(t);
          currentTeachers.push(teacherWithId);
          newTeachers.push(teacherWithId);
        }
      }
        
      if (newTeachers.length === 0) return state;
      
      return {
        teachers: [...state.teachers, ...newTeachers],
      };
    }),

  editTeacher: (id, updates) =>
    set((state) => {
      const updateFn = (t: Teacher) =>
        t.id === id ? { ...t, ...updates } : t;

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
          (t) => t.id !== id,
        );
        return {
          ...timetable,
          selectedTeachers: newSelectedTeachers,
          selectedSlots: Array.from(
            new Set(
              newSelectedTeachers.flatMap((t) => getAllSlots(t)),
            ),
          ),
        };
      });

      return {
        teachers: state.teachers.filter((t) => t.id !== id),
        timetables: newTimetables,
      };
    }),

  removeTeachers: (ids) =>
    set((state) => {
      if (ids.length === 0) return state;
      clearClashDetectionCaches();

      const newTimetables = state.timetables.map((timetable) => {
        const newSelectedTeachers = timetable.selectedTeachers.filter(
          (t) => !ids.includes(t.id),
        );
        return {
          ...timetable,
          selectedTeachers: newSelectedTeachers,
          selectedSlots: Array.from(
            new Set(
              newSelectedTeachers.flatMap((t) => getAllSlots(t)),
            ),
          ),
        };
      });

      return {
        teachers: state.teachers.filter((t) => !ids.includes(t.id)),
        timetables: newTimetables,
      };
    }),

  deleteAllTeachersForCourse: (courseId) =>
    set((state) => {
      clearClashDetectionCaches();

      const newTimetables = state.timetables.map((timetable) => {
        const newSelectedTeachers = timetable.selectedTeachers.filter(
          (t) => t.course !== courseId,
        );
        return {
          ...timetable,
          selectedTeachers: newSelectedTeachers,
          selectedSlots: Array.from(
            new Set(
              newSelectedTeachers.flatMap((t) => getAllSlots(t)),
            ),
          ),
        };
      });

      return {
        teachers: state.teachers.filter((t) => t.course !== courseId),
        timetables: newTimetables,
      };
    }),

  replaceCourseTeachers: (courseId: string, newTeachers: Teacher[]) =>
    set((state) => {
      clearClashDetectionCaches();
      
      const filteredTeachers = state.teachers.filter((t) => !t.id.startsWith(courseId));
      const finalTeachers = [...filteredTeachers, ...newTeachers.map(normalizeTeacher)];

      return {
        teachers: finalTeachers,
      };
    }),
});
