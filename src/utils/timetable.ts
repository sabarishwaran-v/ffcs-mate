import { Teacher } from "@/types";

import { afternoonTheorySlots, morningTheorySlots } from "../constants/slots";

export function getAllSlots(teacher: Teacher | null | undefined): string[] {
  if (!teacher || !teacher.slots) return [];
  const { morning, afternoon } = teacher.slots;
  const rawSlots = [...(morning ?? []), ...(afternoon ?? [])];
  return rawSlots
    .flatMap(s => (typeof s === "string" ? s.split("+").map(part => part.trim()) : []))
    .filter(Boolean);
}

export function getAllVenues(teacher: Teacher | null | undefined): string[] {
  if (!teacher || !teacher.venue) return [];
  const { morning, afternoon } = teacher.venue;
  return [morning, afternoon].filter(Boolean) as string[];
}

export function getVenueForSlot(teacher: Teacher, slot: string): string | null {
  const morningSlots = (teacher.slots.morning ?? []).flatMap(s => (typeof s === "string" ? s.split("+").map(p => p.trim()) : []));
  if (morningSlots.includes(slot)) {
    return teacher.venue.morning;
  }
  const afternoonSlots = (teacher.slots.afternoon ?? []).flatMap(s => (typeof s === "string" ? s.split("+").map(p => p.trim()) : []));
  if (afternoonSlots.includes(slot)) {
    return teacher.venue.afternoon;
  }
  return null;
}

export function isMorningSlot(slot: string): boolean {
  const parts = slot.split("+").map(s => s.trim()).filter(Boolean);
  const targetSlot = parts[0] || slot;
  const labMatch = targetSlot.match(/L(\d+)/);
  if (labMatch) {
    return parseInt(labMatch[1]) <= 30;
  }

  return morningTheorySlots.includes(targetSlot);
}

export function isAfternoonSlot(slot: string): boolean {
  const parts = slot.split("+").map(s => s.trim()).filter(Boolean);
  const targetSlot = parts[0] || slot;
  const labMatch = targetSlot.match(/L(\d+)/);
  if (labMatch) {
    return parseInt(labMatch[1]) > 30;
  }

  return afternoonTheorySlots.includes(targetSlot);
}

export function isMorningTheory(slot: string): boolean {
  const parts = slot.split("+").map(s => s.trim()).filter(Boolean);
  const targetSlot = parts[0] || slot;
  const labMatch = targetSlot.match(/L(\d+)/);
  if (labMatch) {
    return parseInt(labMatch[1]) > 30;
  }

  return morningTheorySlots.includes(targetSlot);
}

export function isAfternoonTheory(slot: string): boolean {
  const parts = slot.split("+").map(s => s.trim()).filter(Boolean);
  const targetSlot = parts[0] || slot;
  const labMatch = targetSlot.match(/L(\d+)/);
  if (labMatch) {
    return parseInt(labMatch[1]) <= 30;
  }

  return afternoonTheorySlots.includes(targetSlot);
}
