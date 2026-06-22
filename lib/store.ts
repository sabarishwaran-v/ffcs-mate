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
    }
  )
);

export const useFeatureFlags = create<FeatureFlagStore>()(
  persist(
    (set, get) => ({
      flags: {
        newOptimizations: false,
        hookOptimization: false,
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
