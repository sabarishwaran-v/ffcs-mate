// Clash Engine derived from legacy ffcs-mate logic

export function checkSlotClash(slots1: string[], slots2: string[]): boolean {
  // If any slot in course 1 exactly matches a slot in course 2, it's a clash
  for (const s1 of slots1) {
    if (slots2.includes(s1)) {
      return true;
    }
  }

  // The legacy logic also handled some complex overlaps (like Lab vs Theory overlaps).
  // In VTOP, sometimes L31 and A2 overlap depending on the specific mapping.
  // For a robust implementation, we map slots to an exact [Day, TimeIndex] matrix.
  // If two slots map to the same cell in the matrix, they clash.
  
  // (This will be fully wired up when we bind the slots to the grid)
  return false;
}

export function getClashingCourses(targetSlots: string[], allSelectedCourses: any[]) {
  const clashing: string[] = [];
  
  allSelectedCourses.forEach(course => {
    if (checkSlotClash(targetSlots, course.slots)) {
      clashing.push(course.code);
    }
  });

  return clashing;
}
