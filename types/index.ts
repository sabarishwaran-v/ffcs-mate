export type ButtonIconType = "add" | "edit";

export interface DialogButtonProps {
  buttonIcon?: ButtonIconType;
  buttonText?: string;
  disabled?: boolean;
}

export interface TimeRange {
  start: string;
  end: string;
}

export interface ClashDetails {
  teachers: string[];
  courses: string[];
  slots: string[];
}

export interface CellData {
  colorCache: Record<string, string>;
  teacherCache: Record<string, string>;
  venueCache: Record<string, string>;
}

export interface CellRenderData {
  color: string;
  teacherName: string;
  courseCode: string;
  venue: string;
  isClash: boolean;
  clashDetails: { courses: string[] } | null;
  isSelectedManual: boolean;
}

export interface TimetableRenderData {
  cellsData: Record<string, Record<string, CellRenderData>>; // Day -> SlotKey -> CellRenderData
  totalCredits: number;
  allClashesCount: number;
  manualSelectedSlots: string[];
}

export interface Course {
  id: string;
  name: string;
  code: string;
  credits: number;
  type?: string;
  theorySlots?: string[];
  labSlots?: string[];
  hasProjectComponent?: boolean;
}

export interface Teacher {
  id: string;
  name: string;
  color: string;
  slots: {
    morning: string[] | null;
    afternoon: string[] | null;
  };
  venue: {
    morning: string | null;
    afternoon: string | null;
  };
  course: string;
  addedByUid?: string;
  addedByName?: string;
}

export interface Timetable {
  id: string;
  name: string;
  selectedTeachers: Teacher[];
  selectedSlots: string[];
  updatedAt?: Date;
}

export interface ExportData {
  courses: Course[];
  teachers: Teacher[];
  selectedTeachers: Teacher[];
  selectedSlots: string[];
  timetables?: Timetable[];
  activeTimetableId?: string | null;
}

export interface ClashInfo {
  slot: string;
  teacher1: Teacher;
  teacher2: Teacher;
}
