import { StateCreator } from "zustand";
import { StoreState } from "../types";
import { clearClashDetectionCaches } from "@/src/utils/clash-detection";

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

  setNo8amRule: (val: boolean) => set({ no8amRule: val }),

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
