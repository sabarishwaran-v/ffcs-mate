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

import { collection, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

import fallbackData from './fallback_faculties.json';

export const useFacultyStore = create<{
  approvedFaculties: Record<string, ApprovedFaculty>;
  contributionsCount: Record<string, number>;
  isFetching: boolean;
  isListening: boolean;
  fetchApprovedFaculties: () => void;
}>((set, get) => ({
  // Initialize with fallback data
  approvedFaculties: fallbackData as Record<string, ApprovedFaculty>,
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
          set({ approvedFaculties: data as Record<string, ApprovedFaculty> });
        } else {
          // If no bundle exists in DB, keep using fallback
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

export const useOptimisticStore = create<{
  optimisticFaculties: Record<string, ApprovedFaculty>;
  addOptimisticFaculty: (id: string, faculty: ApprovedFaculty) => void;
}>()(
  persist(
    (set) => ({
      optimisticFaculties: {},
      addOptimisticFaculty: (id, faculty) => 
        set((state) => ({ 
          optimisticFaculties: { ...state.optimisticFaculties, [id]: faculty } 
        })),
    }),
    { name: 'optimistic-faculties-v1' }
  )
);
