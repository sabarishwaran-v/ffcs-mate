import { Course, Teacher } from "@/types";

export const course1: Course = {
  id: "CS101",
  name: "Introduction to Computer Science",
  code: "CS101",
  credits: 4,
};

export const course2: Course = {
  id: "MATH101",
  name: "Calculus I",
  code: "MATH101",
  credits: 3,
};

export const teacherTheoryOnlyMA: Teacher = {
  id: "T1",
  name: "Alice Smith",
  color: "purple",
  slots: {
    morning: ["A1", "TA1"],
    afternoon: null,
  },
  venue: {
    morning: "Room 101",
    afternoon: "Room 102",
  },
  course: course1.id,
};

export const teacherTheoryOnlyMB: Teacher = {
  id: "T2",
  name: "Bob Johnson",
  color: "purple",
  slots: {
    morning: ["B1", "TB1"],
    afternoon: null,
  },
  venue: {
    morning: "Room 201",
    afternoon: "Room 202",
  },
  course: course2.id,
};

export const teacherTheoryOnlyMC: Teacher = {
  id: "T3",
  name: "Charlie Brown",
  color: "purple",
  slots: {
    morning: ["C1", "TC1"],
    afternoon: null,
  },
  venue: {
    morning: "Room 301",
    afternoon: "Room 302",
  },
  course: course1.id,
};

export const teacherLabOnlyM1: Teacher = {
  id: "T4",
  name: "Diana Prince",
  color: "purple",
  slots: {
    morning: ["L1", "L2"],
    afternoon: null,
  },
  venue: {
    morning: "Room 401",
    afternoon: "Room 402",
  },
  course: course2.id,
};

export const teacherLabOnlyM2: Teacher = {
  id: "T5",
  name: "Ethan Hunt",
  color: "purple",
  slots: {
    morning: ["L3", "L4"],
    afternoon: null,
  },
  venue: {
    morning: "Room 501",
    afternoon: "Room 502",
  },
  course: course1.id,
};

export const teacherLabOnlyM3: Teacher = {
  id: "T6",
  name: "Fiona Gallagher",
  color: "purple",
  slots: {
    morning: ["L5", "L6"],
    afternoon: null,
  },
  venue: {
    morning: "Room 601",
    afternoon: "Room 602",
  },
  course: course2.id,
};
