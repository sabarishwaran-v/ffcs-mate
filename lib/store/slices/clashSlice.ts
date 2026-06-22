import { StateCreator } from "zustand";
import { StoreState } from "../types";
import {
  hasClashEnhanced,
  hasClashUsingMap,
} from "@/src/utils/clash-detection";
import { getAllSlots } from "@/src/utils/timetable";
import { Teacher, ClashInfo } from "@/types";
import { useFeatureFlags } from "@/lib/store";

export type ClashSlice = Pick<
  StoreState,
  | "teacherSlotClash"
  | "hasSameSlotClashWithSelected"
  | "getAllClashesEnhanced"
>;

// Cache for stringified slot representations to optimize hasSameSlotClashWithSelected
const slotRepresentationCache = new Map<string, string>();

function getSlotRepresentation(teacher: Teacher): string {
  if (slotRepresentationCache.has(teacher.id)) {
    return slotRepresentationCache.get(teacher.id)!;
  }
  const representation = [...getAllSlots(teacher)].sort().join(",");
  slotRepresentationCache.set(teacher.id, representation);
  return representation;
}

export const createClashSlice: StateCreator<
  StoreState,
  [],
  [],
  ClashSlice
> = (set, get) => ({
  teacherSlotClash: (teacherId) => {
    const teacherToConsider = get().teachers.find(
      (t) => t.id === teacherId,
    );
    if (!teacherToConsider) return [];

    const otherSelectedTeachers = get()
      .getSelectedTeachers()
      .filter((t) => t.id !== teacherId);

    const clashes: Teacher[] = hasClashEnhanced(
      teacherToConsider,
      otherSelectedTeachers,
    );

    return clashes;
  },

  hasSameSlotClashWithSelected: (teacherId) => {
    const teacherToConsider = get().teachers.find(
      (t) => t.id === teacherId,
    );
    if (!teacherToConsider) return false;

    const useOptimizations = useFeatureFlags.getState().isEnabled("newOptimizations");

    const sortedTeacherToConsiderSlots = useOptimizations 
      ? getSlotRepresentation(teacherToConsider)
      : [...getAllSlots(teacherToConsider)].sort().join(",");

    const currentlySelectedTeachers = get()
      .getSelectedTeachers()
      .filter((t) => t.id !== teacherId);

    for (const otherSelectedTeacher of currentlySelectedTeachers) {
      const otherTeacherSlots = useOptimizations
        ? getSlotRepresentation(otherSelectedTeacher)
        : [...getAllSlots(otherSelectedTeacher)].sort().join(",");
        
      if (
        teacherToConsider.course === otherSelectedTeacher.course &&
        sortedTeacherToConsiderSlots === otherTeacherSlots
      ) {
        return true;
      }
    }
    return false;
  },

  getAllClashesEnhanced: (teachers: Teacher[]) => {
    const clashes: ClashInfo[] = [];
    const processedClashes = new Set<string>();

    for (let i = 0; i < teachers.length; i++) {
      for (let j = i + 1; j < teachers.length; j++) {
        const teacher1 = teachers[i];
        const teacher2 = teachers[j];

        if (teacher1.id === teacher2.id) continue;

        const clashMap = hasClashUsingMap(teacher1, teacher2);
        if (clashMap.length > 0) {
          clashMap.forEach((clash) => {
            const clashId = `${teacher1.id}-${teacher2.id}-${clash}`;

            if (!processedClashes.has(clashId)) {
              processedClashes.add(clashId);
              clashes.push({
                slot: clash,
                teacher1,
                teacher2,
              });
            }
          });
        }
      }
    }
    return clashes;
  },
});
