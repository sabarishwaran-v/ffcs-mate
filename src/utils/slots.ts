import { afternoonTheorySlots, morningTheorySlots } from "../constants/slots";
import { SlotType, TeacherMap } from "../types/slots";
import { isAfternoonSlot, isMorningSlot } from "./timetable";

export function mergeSlots(dataLines: string[]): string[] {
  const teacherMap: TeacherMap = {};

  // Parse and group by teacher
  for (const line of dataLines) {
    const [slotStr, venue, ...rest] = line.split(/\s+/);
    const type = rest.pop() as SlotType;
    const teacher = rest.join(" ");

    if (!teacherMap[teacher]) {
      teacherMap[teacher] = { ELA: [], ETH: [] };
    }

    teacherMap[teacher][type].push({ slot: slotStr, venue, type });
  }

  const result: string[] = [];

  for (const [teacher, { ELA, ETH }] of Object.entries(teacherMap)) {
    const merged: string[] = [];
    const usedETH = new Set<string>();

    for (const elaEntry of ELA) {
      let prefix = "";
      const elaSlots = elaEntry.slot.split("+");
      const venue: [string, string][] = [];

      for (const ethEntry of ETH) {
        const ethSlot = ethEntry.slot;
        if (
          !usedETH.has(ethSlot) &&
          ((morningTheorySlots.includes(ethSlot) &&
            elaSlots.some(isAfternoonSlot)) ||
            (afternoonTheorySlots.includes(ethSlot) &&
              elaSlots.some(isMorningSlot)))
        ) {
          venue.push([ethEntry.venue, elaEntry.venue]);
          prefix = ethSlot + "+";
          usedETH.add(ethSlot);
          break;
        }
      }

      if (venue.length === 0) {
        merged.push(`${elaEntry.slot}\t${elaEntry.venue}\t${teacher}\tELA`);
      } else {
        merged.push(
          `${prefix}${elaEntry.slot}\t${venue.join(",")}\t${teacher}\tEM`,
        );
      }
    }

    for (const ethEntry of ETH) {
      if (!usedETH.has(ethEntry.slot)) {
        merged.push(`${ethEntry.slot}\t${ethEntry.venue}\t${teacher}\tETH`);
      }
    }

    result.push(...merged);
  }

  return result;
}
