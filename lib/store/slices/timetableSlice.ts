import { StateCreator } from "zustand";
import { StoreState } from "../types";
import { getAllSlots } from "@/src/utils/timetable";
import { clearClashDetectionCaches, hasClashUsingMap, getDetailedClashMessage, check8amClash } from "@/src/utils/clash-detection";
import { defaultTimetable } from "@/src/mocks/fake-timetable";
import { Timetable, Teacher } from "@/types";

export type TimetableSlice = Pick<
  StoreState,
  | "timetables"
  | "activeTimetableId"
  | "createTimetable"
  | "deleteTimetable"
  | "renameTimetable"
  | "setActiveTimetable"
  | "duplicateTimetable"
  | "getActiveTimetable"
  | "getSelectedTeachers"
  | "getSelectedSlots"
  | "clearSelectedTeachers"
  | "toggleTeacherInTimetable"
  | "isTeacherSelected"
  | "setCourseSlots"
  | "activeRoomId"
  | "roomRole"
  | "viewMode"
  | "personalDataBackup"
  | "setRoomMode"
  | "setRoomRole"
  | "setViewMode"
  | "cloneToPersonal"
  | "isReceivingCloudUpdate"
  | "setIsReceivingCloudUpdate"
>;

export const createTimetableSlice: StateCreator<
  StoreState,
  [],
  [],
  TimetableSlice
> = (set, get) => ({
  timetables: [defaultTimetable],
  activeTimetableId: null,
  activeRoomId: null,
  roomRole: null,
  viewMode: "room",
  personalDataBackup: null,
  isReceivingCloudUpdate: false,

  setRoomMode: (roomId) => set((state) => {
    if (roomId && !state.activeRoomId) {
      // Joining a room: backup personal data
      return { 
        activeRoomId: roomId,
        viewMode: "room",
        personalDataBackup: {
          courses: state.courses,
          teachers: state.teachers,
          timetables: state.timetables,
          activeTimetableId: state.activeTimetableId
        }
      };
    } else if (!roomId && state.activeRoomId) {
      // Leaving a room: restore personal data
      if (state.personalDataBackup) {
        return {
          activeRoomId: null,
          roomRole: null,
          viewMode: "personal",
          courses: state.personalDataBackup.courses,
          teachers: state.personalDataBackup.teachers,
          timetables: state.personalDataBackup.timetables,
          activeTimetableId: state.personalDataBackup.activeTimetableId,
          personalDataBackup: null
        };
      } else {
        return { activeRoomId: null, roomRole: null, viewMode: "personal" };
      }
    }
    return { activeRoomId: roomId };
  }),
  setRoomRole: (role) => set({ roomRole: role }),
  setViewMode: (mode) => set((state) => {
    if (state.viewMode === mode) return {};
    
    // We are switching modes. The inactive mode's data is in personalDataBackup, and active mode data is in the main state.
    // So we just swap them!
    const currentMainData = {
      courses: state.courses,
      teachers: state.teachers,
      timetables: state.timetables,
      activeTimetableId: state.activeTimetableId
    };

    return {
      viewMode: mode,
      courses: state.personalDataBackup?.courses || [],
      teachers: state.personalDataBackup?.teachers || [],
      timetables: state.personalDataBackup?.timetables || [],
      activeTimetableId: state.personalDataBackup?.activeTimetableId || null,
      personalDataBackup: currentMainData
    };
  }),
  cloneToPersonal: () => set((state) => {
    if (!state.activeRoomId) return {}; // Can only clone if in a room
    
    // Copy the current room state (which is currently residing in the active state variables)
    // into the personalDataBackup
    return {
      personalDataBackup: {
        courses: [...state.courses],
        teachers: [...state.teachers],
        timetables: [...state.timetables],
        activeTimetableId: state.activeTimetableId
      }
    };
  }),
  setIsReceivingCloudUpdate: (val) => set({ isReceivingCloudUpdate: val }),

  createTimetable: (name) => {
    const id = crypto.randomUUID();
    const currentTime = new Date();
    const timetableName = name || `Timetable ${get().timetables.length + 1}`;

    const newTimetable: Timetable = {
      id,
      name: timetableName,
      selectedTeachers: [],
      selectedSlots: [],
      updatedAt: currentTime,
    };

    set((state) => ({
      timetables: [...state.timetables, newTimetable],
      activeTimetableId: id,
    }));

    return id;
  },

  deleteTimetable: (id) =>
    set((state) => {
      let newTimetables = state.timetables.filter((t) => t.id !== id);
      
      // Prevent completely emptying the timetables array to avoid state updates during render getters
      if (newTimetables.length === 0) {
        newTimetables = [{
          id: Math.random().toString(36).substr(2, 9),
          name: "Timetable 1",
          selectedTeachers: [],
          selectedSlots: [],
          updatedAt: new Date(),
        }];
      }

      const newActiveTimetableId =
        state.activeTimetableId === id
          ? newTimetables[0].id
          : state.activeTimetableId;

      return {
        timetables: newTimetables,
        activeTimetableId: newActiveTimetableId,
      };
    }),

  renameTimetable: (id, name) =>
    set((state) => ({
      timetables: state.timetables.map((t) =>
        t.id === id ? { ...t, name, updatedAt: new Date() } : t,
      ),
    })),

  setActiveTimetable: (id) => set({ activeTimetableId: id }),

  duplicateTimetable: (id, newName) => {
    const state = get();
    const sourceTimetable = state.timetables.find((t) => t.id === id);
    if (!sourceTimetable) return "";

    const newId = crypto.randomUUID();
    const currentTime = new Date();
    const timetableName = newName || `${sourceTimetable.name} (Copy)`;

    const newTimetable: Timetable = {
      id: newId,
      name: timetableName,
      selectedTeachers: [...sourceTimetable.selectedTeachers],
      selectedSlots: [...sourceTimetable.selectedSlots],
      updatedAt: currentTime,
    };

    set((state) => ({
      timetables: [...state.timetables, newTimetable],
      activeTimetableId: newId,
    }));

    return newId;
  },

  getActiveTimetable: () => {
    const state = get();
    let currentTimetableId = state.activeTimetableId;
    if (!state.activeTimetableId) {
      currentTimetableId = state.timetables[0]?.id;
    }
    return state.timetables.find((t) => t.id === currentTimetableId) || state.timetables[0] || null;
  },

  getSelectedTeachers: () => {
    const activeTimetable = get().getActiveTimetable();
    return activeTimetable?.selectedTeachers || [];
  },

  getSelectedSlots: () => {
    const activeTimetable = get().getActiveTimetable();
    return activeTimetable?.selectedSlots || [];
  },

  clearSelectedTeachers: () => {
    const state = get();
    let currentTimetableId = state.activeTimetableId;
    if (!state.activeTimetableId) {
      currentTimetableId = state.timetables[0]?.id || get().createTimetable();
    }

    set((state) => ({
      timetables: state.timetables.map((t) =>
        t.id === currentTimetableId
          ? {
              ...t,
              selectedTeachers: [],
              selectedSlots: [],
              updatedAt: new Date(),
            }
          : t,
      ),
    }));

    clearClashDetectionCaches();
  },

  dropCourse: (courseId) => {
    const state = get();
    const currentTimetableId = state.activeTimetableId;
    if (!currentTimetableId) return;

    clearClashDetectionCaches();

    set((state) => ({
      timetables: state.timetables.map((t) => {
        if (t.id !== currentTimetableId) return t;

        const newSelectedTeachers = t.selectedTeachers.filter(
          (st) => {
            const teacherObj = state.teachers.find(teacher => teacher.id === st.id);
            return teacherObj?.course !== courseId;
          }
        );

        return {
          ...t,
          selectedTeachers: newSelectedTeachers,
          selectedSlots: Array.from(
            new Set(newSelectedTeachers.flatMap((st) => getAllSlots(st))),
          ),
          updatedAt: new Date(),
        };
      }),
    }));
  },


  toggleTeacherInTimetable: (teacherId, addedByUid, addedByName) => {
    const state = get();
    let currentTimetableId = state.activeTimetableId;
    if (!state.activeTimetableId) {
      currentTimetableId = state.timetables[0]?.id || get().createTimetable();
    }

    const teacher = state.teachers.find((t) => t.id === teacherId);
    if (!teacher) return { success: false };

    const activeTimetable = state.getActiveTimetable();
    if (!activeTimetable) return { success: false };

    const isSelected = activeTimetable.selectedTeachers.some(
      (t) => t.id === teacherId,
    );

    if (!isSelected && state.no8amRule) {
      const course = state.courses.find(c => c.id === teacher.course);
      const clashMsg = check8amClash(teacher, course?.code || 'Course', course?.type);
      if (clashMsg) {
        return { success: false, clashMessage: clashMsg };
      }
    }

    clearClashDetectionCaches();

    set((state) => ({
      timetables: state.timetables.map((t) => {
        if (t.id !== currentTimetableId) return t;

        if (isSelected) {
          const newSelectedTeachers = t.selectedTeachers.filter(
            (st) => st.id !== teacherId,
          );
          return {
            ...t,
            selectedTeachers: newSelectedTeachers,
            selectedSlots: Array.from(
              new Set(newSelectedTeachers.flatMap((st) => getAllSlots(st))),
            ),
            updatedAt: new Date(),
          };
        } else {
          // Inject author info
          const newTeacher = { 
            ...teacher,
            addedByUid: addedByUid || teacher.addedByUid,
            addedByName: addedByName || teacher.addedByName 
          };
          const newSelectedTeachers = [...t.selectedTeachers, newTeacher];
          return {
            ...t,
            selectedTeachers: newSelectedTeachers,
            selectedSlots: Array.from(
              new Set(newSelectedTeachers.flatMap((st) => getAllSlots(st))),
            ),
            updatedAt: new Date(),
          };
        }
      }),
    }));

    return { success: true };
  },

  setCourseSlots: (courseId, teacherIds, addedByUid, addedByName) => {
    const state = get();
    let currentTimetableId = state.activeTimetableId;
    if (!state.activeTimetableId) {
      currentTimetableId = state.timetables[0]?.id || get().createTimetable();
    }

    const activeTimetable = state.getActiveTimetable();
    if (!activeTimetable) return { success: false };

    // Find the new teacher entities to place
    const newTeachersToPlace = teacherIds
      .map((id) => state.teachers.find((t) => t.id === id))
      .filter((t): t is Teacher => t !== undefined)
      .map(t => ({
        ...t,
        addedByUid: addedByUid || t.addedByUid,
        addedByName: addedByName || t.addedByName
      }));

    // Filter out ANY currently selected slots belonging to this course (this implements the "Swap" feature)
    const otherTeachersInTimetable = activeTimetable.selectedTeachers.filter(
      (t) => t.course !== courseId
    );

    // Strict Clash Check: Do any of the new teachers clash with any remaining teachers?
    let clashMessage: string | undefined = undefined;

    const currentCourse = state.courses.find(c => c.id === courseId);
    const currentCourseCode = currentCourse ? currentCourse.code : "Course";

    for (const newTeacher of newTeachersToPlace) {
      if (state.no8amRule) {
        const clashMsg = check8amClash(newTeacher, currentCourseCode, currentCourse?.type);
        if (clashMsg) {
          clashMessage = clashMsg;
          break;
        }
      }

      for (const existingTeacher of otherTeachersInTimetable) {
        const existingCourse = state.courses.find(c => c.id === existingTeacher.course);
        const detailedMsg = getDetailedClashMessage(newTeacher, existingTeacher, currentCourseCode, existingCourse?.code || "Another Course");
        
        if (detailedMsg) {
          clashMessage = detailedMsg;
          break;
        }
      }
      if (clashMessage) break;
    }

    // Check new teachers against each other (e.g., Theory vs Lab of the same course)
    if (!clashMessage) {
      for (let i = 0; i < newTeachersToPlace.length; i++) {
        for (let j = i + 1; j < newTeachersToPlace.length; j++) {
          const detailedMsg = getDetailedClashMessage(newTeachersToPlace[i], newTeachersToPlace[j], currentCourseCode, currentCourseCode);
          if (detailedMsg) {
            clashMessage = detailedMsg;
            break;
          }
        }
        if (clashMessage) break;
      }
    }

    if (clashMessage) {
      return { success: false, clashMessage };
    }

    // No clash! Proceed with state update.
    clearClashDetectionCaches();

    const newSelectedTeachers = [...otherTeachersInTimetable, ...newTeachersToPlace];
    const newSelectedSlots = Array.from(
      new Set(newSelectedTeachers.flatMap((st) => getAllSlots(st)))
    );

    set((state) => ({
      timetables: state.timetables.map((t) =>
        t.id === currentTimetableId
          ? {
              ...t,
              selectedTeachers: newSelectedTeachers,
              selectedSlots: newSelectedSlots,
              updatedAt: new Date(),
            }
          : t
      ),
    }));

    return { success: true };
  },

  isTeacherSelected: (teacherId) => {
    const selectedTeachers = get().getSelectedTeachers();
    return selectedTeachers.some((t) => t.id === teacherId);
  },
});
