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

export const useFacultyStore = create<{
  approvedFaculties: Record<string, ApprovedFaculty>;
  isFetching: boolean;
  isListening: boolean;
  fetchApprovedFaculties: () => void;
}>((set, get) => ({
  approvedFaculties: {},
  isFetching: false,
  isListening: false,
  fetchApprovedFaculties: () => {
    // Prevent duplicate listeners
    if (get().isListening) return;
    
    set({ isFetching: true, isListening: true });
    try {
      const q = collection(db, 'approved_faculties');
      onSnapshot(q, (snapshot) => {
        const faculties: Record<string, ApprovedFaculty> = {};
        snapshot.forEach((doc) => {
          faculties[doc.id] = { id: doc.id, ...doc.data() } as ApprovedFaculty;
        });
        set({ approvedFaculties: faculties, isFetching: false });
      }, (error) => {
        console.error("Failed to fetch approved faculties:", error);
        set({ isFetching: false, isListening: false });
      });
    } catch (error) {
      console.error("Failed to setup listener:", error);
      set({ isFetching: false, isListening: false });
    }
  }
}));
