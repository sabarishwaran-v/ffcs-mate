import { ClashInfo, Course, Teacher, Timetable } from "@/types";

export type FeatureFlags = {
  newOptimizations: boolean;
  hookOptimization: boolean;
}

export type FeatureFlagStore = {
  flags: FeatureFlags;
  setFlag: (flag: keyof FeatureFlags, value: boolean) => void;
  setFlags: (flags: Partial<FeatureFlags>) => void;
  isEnabled: (flag: keyof FeatureFlags) => boolean;
}

export type State = {
  courses: Course[];
  teachers: Teacher[];
  timetables: Timetable[];
  activeTimetableId: string | null;
  activeRoomId: string | null;
  roomRole: "editor" | "spectator" | null;
  viewMode: "room" | "personal";
  personalDataBackup: any | null;
  isReceivingCloudUpdate: boolean;
  activeSemester: string | null;
  no8amRule: boolean;
};

export type Actions = {
  // Global Actions
  setSemester: (semester: string | null) => void;
  setNo8amRule: (val: boolean) => void;

  // Course actions
  getCourse: (id: string) => Course | undefined;
  addCourse: (course: Omit<Course, "id"> & { id?: string }) => void;
  editCourse: (id: string, course: Partial<Omit<Course, "id">>) => void;
  removeCourse: (id: string) => void;

  // Teacher actions
  addTeacher: (teacher: Omit<Teacher, "id"> & { id?: string }) => void;
  editTeacher: (id: string, teacher: Partial<Omit<Teacher, "id">>) => void;
  removeTeacher: (id: string) => void;
  deleteAllTeachersForCourse: (courseId: string) => void;

  // Timetable actions
  createTimetable: (name?: string) => string;
  deleteTimetable: (id: string) => void;
  renameTimetable: (id: string, name: string) => void;
  setActiveTimetable: (id: string) => void;
  duplicateTimetable: (id: string, newName?: string) => string;

  // Active timetable actions
  getActiveTimetable: () => Timetable | null;
  setRoomMode: (roomId: string | null) => void;
  setRoomRole: (role: "editor" | "spectator" | null) => void;
  setViewMode: (mode: "room" | "personal") => void;
  cloneToPersonal: () => void;
  setIsReceivingCloudUpdate: (val: boolean) => void;
  getSelectedTeachers: () => Teacher[];
  getSelectedSlots: () => string[];
  toggleTeacherInTimetable: (teacherId: string, addedByUid?: string, addedByName?: string) => { success: boolean; clashMessage?: string };
  setCourseSlots: (courseId: string, teacherIds: string[], addedByUid?: string, addedByName?: string) => { success: boolean; clashMessage?: string };
  dropCourse: (courseId: string) => void;
  isTeacherSelected: (teacherId: string) => boolean;
  clearSelectedTeachers: () => void;

  // Clash detection
  teacherSlotClash: (teacherId: string) => Teacher[];
  hasSameSlotClashWithSelected: (teacherId: string) => boolean;
  getAllClashesEnhanced: (teachers: Teacher[]) => ClashInfo[];

  // Import/Export
  getExportData: () => {
    courses: Course[];
    teachers: Teacher[];
    timetables: Timetable[];
    activeTimetableId: string | null;
  };
  setExportData: (data: {
    courses: Course[];
    teachers: Teacher[];
    selectedTeachers: Teacher[];
    selectedSlots: string[];
    timetables?: Timetable[];
    activeTimetableId?: string | null;
  }) => void;
  setCloudData: (data: any) => void;

  // Utility
  clearAll: () => void;
  clearClashCaches: () => void;
};

export type StoreState = State & Actions;
