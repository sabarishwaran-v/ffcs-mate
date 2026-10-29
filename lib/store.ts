"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { FeatureFlagStore, StoreState } from "./store/types";
import { createCourseSlice } from "./store/slices/courseSlice";
import { createTeacherSlice } from "./store/slices/teacherSlice";
import { createTimetableSlice } from "./store/slices/timetableSlice";
import { createClashSlice } from "./store/slices/clashSlice";
import { createImportExportSlice } from "./store/slices/importExportSlice";
import { createUtilitySlice } from "./store/slices/utilitySlice";
import { ApprovedFaculty } from "@/types";

export const useScheduleStore = create<StoreState>()(
  persist(
    (...a) => ({
      ...createCourseSlice(...a),
      ...createTeacherSlice(...a),
      ...createTimetableSlice(...a),
      ...createClashSlice(...a),
      ...createImportExportSlice(...a),
      ...createUtilitySlice(...a),
    }),
    {
      name: "schedule-store",
      partialize: (state) => ({
        courses: state.courses,
        teachers: state.teachers,
        timetables: state.timetables,
        activeTimetableId: state.activeTimetableId,
        activeSemester: state.activeSemester,
      }),
    },
  ),
);

export const useFeatureFlags = create<FeatureFlagStore>()(
  persist(
    (set, get) => ({
      flags: {
        newOptimizations: false,
        hookOptimization: false
      },

      setFlag: (flag, value) =>
        set((state) => ({
          flags: {
            ...state.flags,
            [flag]: value,
          },
        })),

      setFlags: (flags) =>
        set((state) => ({
          flags: {
            ...state.flags,
            ...flags,
          },
        })),

      isEnabled: (flag) => get().flags[flag],
    }),
    {
      name: "feature-flags",
    }
  )
);

export const manualSlotSelectionStore = create<{
  manualSelectedSlots: string[];
  clearSelectedSlots: () => void;
  selectSlot: (slot: string) => void;
  deselectSlot: (slot: string) => void;
  toggleSlot: (slot: string) => void;
}>((set) => ({
  manualSelectedSlots: [],
  clearSelectedSlots: () => set({ manualSelectedSlots: [] }),
  selectSlot: (slot) =>
    set((state) => ({
      manualSelectedSlots: [...state.manualSelectedSlots, slot],
    })),
  deselectSlot: (slot) =>
    set((state) => ({
      manualSelectedSlots: state.manualSelectedSlots.filter((s) => s !== slot),
    })),
  toggleSlot: (slot) =>
    set((state) => {
      const isSelected = state.manualSelectedSlots.includes(slot);
      return {
        manualSelectedSlots: isSelected
          ? state.manualSelectedSlots.filter((s) => s !== slot)
          : [...state.manualSelectedSlots, slot],
      };
    }),
}));

import { collection, doc, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

import fallbackData from './fallback_faculties.json';

export const useFacultyStore = create<{
  approvedFaculties: Record<string, ApprovedFaculty>;
  contributionsCount: Record<string, number>;
  isFetching: boolean;
  isListening: boolean;
  fetchApprovedFaculties: () => void;
}>((set, get) => ({
  // Initialize with fallback data, mapping facultyName to faculty and ensuring deterministic id
  approvedFaculties: Object.fromEntries(
    Object.entries(fallbackData).map(([k, v]) => [
      k, 
      { ...v, id: (v as any).id || k, faculty: (v as any).facultyName || (v as any).faculty }
    ])
  ) as Record<string, ApprovedFaculty>,
  contributionsCount: {},
  isFetching: false,
  isListening: false,
  fetchApprovedFaculties: () => {
    // Prevent duplicate listeners
    if (get().isListening) return;
    
    set({ isFetching: true, isListening: true });
    try {
      const q = doc(db, 'system', 'approved_faculties_bundle');
      onSnapshot(q, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const mappedData = Object.fromEntries(
            Object.entries(data).map(([k, v]) => [
              k, 
              { ...v, id: (v as any).id || k, faculty: (v as any).facultyName || (v as any).faculty }
            ])
          );
          // Preserve local fallback data and overlay DB data
          const localFallback = Object.fromEntries(
            Object.entries(fallbackData).map(([k, v]) => [
              k, 
              { ...v, id: (v as any).id || k, faculty: (v as any).facultyName || (v as any).faculty }
            ])
          );
          set({ 
            approvedFaculties: {
              ...localFallback,
              ...mappedData,
            } as Record<string, ApprovedFaculty> 
          });
        } else {
          console.log("No DB bundle, using fallback.");
        }
      }, (error) => {
        console.error("Failed to fetch approved faculties bundle. Using local fallback.", error);
        // Do not clear the fallback data if there is an error (like quota exceeded)
      });

      const countDoc = doc(db, 'system', 'contributions_count');
      onSnapshot(countDoc, (docSnap) => {
        if (docSnap.exists()) {
          set({ contributionsCount: docSnap.data() as Record<string, number> });
        }
      });
      
      set({ isFetching: false });
    } catch (error) {
      console.error("Failed to setup listener:", error);
      set({ isFetching: false, isListening: false });
    }
  }
}));

export interface CustomCourseData {
  courseCode: string;
  faculties: Record<string, ApprovedFaculty>;
  isCustomOverride: boolean;
  uploadedAt: string;
}

export const useOptimisticStore = create<{
  optimisticFaculties: Record<string, ApprovedFaculty>;
  customCourseOverrides: Record<string, CustomCourseData>;
  addOptimisticFaculty: (id: string, faculty: ApprovedFaculty) => void;
  setCourseCustomOverride: (courseCode: string, faculties: Record<string, ApprovedFaculty>) => void;
  removeCourseCustomOverride: (courseCode: string) => void;
  hasCourseCustomOverride: (courseCode: string) => boolean;
}>()(
  persist(
    (set, get) => ({
      optimisticFaculties: {},
      customCourseOverrides: {},
      addOptimisticFaculty: (id, faculty) => 
        set((state) => ({ 
          optimisticFaculties: { ...state.optimisticFaculties, [id]: faculty } 
        })),
      setCourseCustomOverride: (courseCode, faculties) =>
        set((state) => ({
          customCourseOverrides: {
            ...state.customCourseOverrides,
            [courseCode]: {
              courseCode,
              faculties,
              isCustomOverride: true,
              uploadedAt: new Date().toISOString(),
            },
          },
          optimisticFaculties: {
            ...state.optimisticFaculties,
            ...faculties,
          },
        })),
      removeCourseCustomOverride: (courseCode) =>
        set((state) => {
          const updatedOverrides = { ...state.customCourseOverrides };
          const override = updatedOverrides[courseCode];
          delete updatedOverrides[courseCode];

          const updatedOptimistic = { ...state.optimisticFaculties };
          if (override?.faculties) {
            Object.keys(override.faculties).forEach((id) => {
              delete updatedOptimistic[id];
            });
          }

          return {
            customCourseOverrides: updatedOverrides,
            optimisticFaculties: updatedOptimistic,
          };
        }),
      hasCourseCustomOverride: (courseCode) => {
        return !!get().customCourseOverrides[courseCode];
      },
    }),
    { name: 'optimistic-faculties-v2' }
  )
);
