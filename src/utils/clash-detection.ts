import { Teacher } from "@/types";
import { getAllSlots } from "./timetable";
import { vitapSlotMapping } from "../../lib/vitap-slot-mapping";

const timeToMinutes = (timeStr: string) => {
  if (!timeStr || !timeStr.includes(':')) return -1;
  const parts = timeStr.split(':');
  if (parts.length < 2) return -1;
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  if (isNaN(h) || isNaN(m)) return -1;
  return h * 60 + m;
};

// Check if two time blocks (e.g., "09:00-09:50" and "09:50-10:40") overlap
const timesOverlap = (time1: string, time2: string) => {
  if (!time1 || !time2 || !time1.includes('-') || !time2.includes('-')) return false;
  
  const [s1, e1] = time1.split('-').map(timeToMinutes);
  const [s2, e2] = time2.split('-').map(timeToMinutes);
  
  // If any time is invalid, assume no overlap to prevent cascading failures
  if (s1 === -1 || e1 === -1 || s2 === -1 || e2 === -1) return false;
  
  // They overlap if max(start1, start2) < min(end1, end2)
  return Math.max(s1, s2) < Math.min(e1, e2);
};

export function hasClashUsingMap(
  teacher1: Teacher,
  teacher2: Teacher,
): string[] {
  const teacher1Slots = getAllSlots(teacher1);
  const teacher2Slots = getAllSlots(teacher2);

  const clashes = new Set<string>();

  for (const slot1 of teacher1Slots) {
    const mappings1 = vitapSlotMapping[slot1];
    if (!mappings1) continue;

    for (const slot2 of teacher2Slots) {
      if (slot1 === slot2) {
        clashes.add(slot1);
        continue;
      }

      const mappings2 = vitapSlotMapping[slot2];
      if (!mappings2) continue;

      // Check if any mapping of slot1 overlaps with any mapping of slot2
      let overlapFound = false;
      for (const m1 of mappings1) {
        for (const m2 of mappings2) {
          if (m1.day === m2.day && m1.day !== undefined) {
            if (timesOverlap(m1.time, m2.time)) {
              overlapFound = true;
              break;
            }
          }
        }
        if (overlapFound) break;
      }

      if (overlapFound) {
        clashes.add(slot1);
        clashes.add(slot2);
      }
    }
  }

  return [...clashes];
}

export function hasClashEnhanced(
  teacher: Teacher,
  teachers: Teacher[],
): Teacher[] {
  return teachers.filter((otherTeacher) => {
    const clashes = hasClashUsingMap(teacher, otherTeacher);
    return clashes.length > 0;
  });
}

export function hasClashSlot(slot: string, teacher: Teacher): boolean {
  const allSlots = getAllSlots(teacher);
  if (allSlots.includes(slot)) return true;

  const mappings1 = vitapSlotMapping[slot];
  if (!mappings1) return false;

  for (const tSlot of allSlots) {
    const mappings2 = vitapSlotMapping[tSlot];
    if (!mappings2) continue;

    for (const m1 of mappings1) {
      for (const m2 of mappings2) {
        if (m1.day === m2.day && m1.day !== undefined) {
          if (timesOverlap(m1.time, m2.time)) {
            return true;
          }
        }
      }
    }
  }
  return false;
}

export function hasClashSlotEnhanced(
  slot: string,
  teachers: Teacher[],
): Teacher[] {
  return teachers.filter((teacher) => hasClashSlot(slot, teacher));
}

export function getDetailedClashMessage(
  teacher1: Teacher,
  teacher2: Teacher,
  course1Code: string,
  course2Code: string
): string | null {
  const teacher1Slots = getAllSlots(teacher1);
  const teacher2Slots = getAllSlots(teacher2);

  for (const slot1 of teacher1Slots) {
    const mappings1 = vitapSlotMapping[slot1];
    if (!mappings1) continue;

    for (const slot2 of teacher2Slots) {
      if (slot1 === slot2) {
        const firstMapping = mappings1[0];
        return `Clash detected! ${course1Code} slot ${slot1} clashes with ${course2Code} slot ${slot2} on ${firstMapping?.day?.toUpperCase() || 'UNKNOWN'} at ${firstMapping?.time || 'Unknown'}`;
      }

      const mappings2 = vitapSlotMapping[slot2];
      if (!mappings2) continue;

      for (const m1 of mappings1) {
        for (const m2 of mappings2) {
          if (m1.day === m2.day && m1.day !== undefined) {
            if (timesOverlap(m1.time, m2.time)) {
              if (m1.time === m2.time) {
                return `Clash detected! ${course1Code} slot ${slot1} clashes with ${course2Code} slot ${slot2} on ${m1.day.toUpperCase()} at ${m1.time}`;
              } else {
                return `Clash detected! ${course1Code} slot ${slot1} clashes with ${course2Code} slot ${slot2} on ${m1.day.toUpperCase()} at ${m1.time} (overlaps with ${m2.time})`;
              }
            }
          }
        }
      }
    }
  }

  return null;
}

const slotDayMapCache = new Map<string, string[]>();

export function getDaysForSlot(slot: string): string[] {
  if (slotDayMapCache.has(slot)) {
    return slotDayMapCache.get(slot)!;
  }

  const occurringDays: string[] = [];
  const mappings = vitapSlotMapping[slot];
  if (mappings) {
    for (const m of mappings) {
      if (m.day && !occurringDays.includes(m.day)) {
        occurringDays.push(m.day);
      }
    }
  }

  slotDayMapCache.set(slot, occurringDays);
  return occurringDays;
}

export const clearClashDetectionCaches = () => {
  slotDayMapCache.clear();
};
