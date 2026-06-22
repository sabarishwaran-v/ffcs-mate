import { StateCreator } from "zustand";
import { StoreState } from "../types";

export type ImportExportSlice = Pick<
  StoreState,
  "getExportData" | "setExportData" | "setCloudData"
>;

export const createImportExportSlice: StateCreator<
  StoreState,
  [],
  [],
  ImportExportSlice
> = (set, get) => ({
  getExportData: () => {
    const { courses, teachers, timetables, activeTimetableId } = get();

    return {
      courses,
      teachers,
      timetables,
      activeTimetableId,
    };
  },

  setExportData: (data) => {
    const {
      courses,
      teachers,
      selectedTeachers,
      selectedSlots,
      timetables,
      activeTimetableId,
    } = data;

    // If importing with timetables data, restore full structure
    if (timetables) {
      set({
        courses,
        teachers,
        timetables: timetables.map((t) => ({
          ...t,
          selectedTeachers: [],
          selectedSlots: [],
        })),
        activeTimetableId: timetables.at(0)?.id || activeTimetableId,
      });
    } else {
      // Legacy import - create a new timetable with the imported data
      const id = get().createTimetable("Imported Timetable");

      set((state) => ({
        courses,
        teachers,
        timetables: state.timetables.map((t) =>
          t.id === id ? { ...t, selectedTeachers, selectedSlots } : t
        ),
        activeTimetableId: id,
      }));
    }
  },

  setCloudData: (data: any) => {
    set((state) => {
      if (state.viewMode === "personal") {
        return {
          personalDataBackup: {
            courses: data.courses,
            teachers: data.teachers,
            timetables: data.timetables,
            activeTimetableId: data.activeTimetableId,
          },
        };
      }
      return {
        courses: data.courses,
        teachers: data.teachers,
        timetables: data.timetables,
        activeTimetableId: data.activeTimetableId,
      };
    });
  },
});
