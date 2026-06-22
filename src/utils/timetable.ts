import { Teacher } from "@/types";

import { afternoonTheorySlots, morningTheorySlots } from "../constants/slots";

export function getAllSlots(teacher: Teacher | null | undefined): string[] {
  if (!teacher || !teacher.slots) return [];
  const { morning, afternoon } = teacher.slots;
  return [...(morning ?? []), ...(afternoon ?? [])];
}

export function getAllVenues(teacher: Teacher | null | undefined): string[] {
  if (!teacher || !teacher.venue) return [];
  const { morning, afternoon } = teacher.venue;
  return [morning, afternoon].filter(Boolean) as string[];
}

export function getVenueForSlot(teacher: Teacher, slot: string): string | null {
  if (teacher.slots.morning?.includes(slot)) {
    return teacher.venue.morning;
  }
  if (teacher.slots.afternoon?.includes(slot)) {
    return teacher.venue.afternoon;
  }
  return null;
}

export function isMorningSlot(slot: string): boolean {
  const labMatch = slot.match(/L(\d+)/);
  if (labMatch) {
    return parseInt(labMatch[1]) <= 30;
  }

  return morningTheorySlots.includes(slot);
}

export function isAfternoonSlot(slot: string): boolean {
  const labMatch = slot.match(/L(\d+)/);
  if (labMatch) {
    return parseInt(labMatch[1]) > 30;
  }

  return afternoonTheorySlots.includes(slot);
}

export function isMorningTheory(slot: string): boolean {
  const labMatch = slot.match(/L(\d+)/);
  if (labMatch) {
    return parseInt(labMatch[1]) > 30;
  }

  return morningTheorySlots.includes(slot);
}

export function isAfternoonTheory(slot: string): boolean {
  const labMatch = slot.match(/L(\d+)/);
  if (labMatch) {
    return parseInt(labMatch[1]) <= 30;
  }

  return afternoonTheorySlots.includes(slot);
}
