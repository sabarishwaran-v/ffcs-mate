import { days } from "../constants/timetable";

export type Slot = string[];
export type Day = (typeof days)[number];
export type TimetableData = Record<Day, Slot[]>;
