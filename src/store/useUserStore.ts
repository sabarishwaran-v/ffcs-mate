import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Course {
  id: string;
  code: string;
  title: string;
  slots: string[];
  faculty?: string;
  venue?: string;
  credits: number;
  type?: string;
}

export interface BaseCourse {
  code: string;
  title: string;
}

export interface UserState {
  regNo: string | null;
  name: string | null;
  email: string | null;
  privacy: {
    shareRegNo: boolean;
    discoverable: boolean;
  };
  hoveredSlots: string[];
  baseCourses: BaseCourse[];
  courseOptions: Record<string, Course[]>;
  selectedCourses: Course[];
  isVitApMode: boolean;
  login: (regNo: string, name: string, email: string) => void;
  updatePrivacy: (settings: Partial<UserState['privacy']>) => void;
  setHoveredSlots: (slots: string[]) => void;
  setVitApMode: (isVitApMode: boolean) => void;
  addBaseCourse: (course: BaseCourse) => void;
  removeBaseCourse: (code: string) => void;
  setCourseOptions: (code: string, options: Course[]) => void;
  checkClash: (slots: string[]) => Course[];
  addCourse: (course: Course) => { success: boolean; clashingWith?: Course[] };
  removeCourse: (courseId: string) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      regNo: null,
      name: null,
      email: null,
      privacy: {
        shareRegNo: false,
        discoverable: false,
      },
      hoveredSlots: [],
      baseCourses: [],
      courseOptions: {},
      selectedCourses: [],
      isVitApMode: false, // Default to false (VIT Vellore style)
      login: (regNo, name, email) => set({ regNo, name, email }),
      updatePrivacy: (settings) => 
        set((state) => ({ privacy: { ...state.privacy, ...settings } })),
      setHoveredSlots: (slots) => set({ hoveredSlots: slots }),
      setVitApMode: (isVitApMode) => set({ isVitApMode }),
      addBaseCourse: (course) => set((state) => ({ baseCourses: [...state.baseCourses, course] })),
      removeBaseCourse: (code) => set((state) => ({ 
        baseCourses: state.baseCourses.filter(c => c.code !== code),
        // also remove from selected courses if any
        selectedCourses: state.selectedCourses.filter(c => c.code !== code)
      })),
      setCourseOptions: (code, options) => set((state) => ({
        courseOptions: { ...state.courseOptions, [code]: options }
      })),
      checkClash: (slots) => {
        const { selectedCourses } = get();
        return selectedCourses.filter(c => c.slots.some(s => slots.includes(s)));
      },
      addCourse: (course) => {
        const clashingWith = get().checkClash(course.slots);
        if (clashingWith.length > 0) return { success: false, clashingWith };
        set((state) => ({ selectedCourses: [...state.selectedCourses, course] }));
        return { success: true };
      },
      removeCourse: (courseId) => 
        set((state) => ({ selectedCourses: state.selectedCourses.filter(c => c.id !== courseId) })),
      logout: () => set({ regNo: null, name: null, email: null, hoveredSlots: [], selectedCourses: [] }),
    }),
    {
      name: 'user-storage',
    }
  )
);
