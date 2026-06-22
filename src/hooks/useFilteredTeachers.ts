import { useMemo } from "react";

import { useScheduleStore } from "@/lib/store";
import { getAllSlots } from "@/src/utils/timetable";
import { Teacher } from "@/types";

export function useFilteredTeachers(
  courseTeachers: Teacher[],
  searchQuery: string,
  slotFilter: string,
  colorFilter: string,
) {
  const { isTeacherSelected, hasSameSlotClashWithSelected, teacherSlotClash } =
    useScheduleStore();

  return useMemo(() => {
    const filtered = courseTeachers.filter((teacher) => {
      const search = searchQuery.toLowerCase();
      const slots = getAllSlots(teacher);
      const venues = [teacher.venue.morning, teacher.venue.afternoon].filter(
        Boolean,
      );

      const matchesSearch =
        teacher.name.toLowerCase().includes(search) ||
        venues.some((v) => v?.toLowerCase().includes(search)) ||
        slots.some((s) => s.toLowerCase().includes(search));

      const matchesSlot =
        !slotFilter || slots.includes(slotFilter.split(" + ")[0]);
      const matchesColor = !colorFilter || teacher.color === colorFilter;

      return matchesSearch && matchesSlot && matchesColor;
    });

    return filtered
      .map((teacher) => ({
        teacher,
        clashes: teacherSlotClash(teacher.id),
        isSelected: isTeacherSelected(teacher.id),
        hasSameSlotClash: hasSameSlotClashWithSelected(teacher.id),
      }))
      .sort((a, b) => {
        // 1. Prioritize selected teachers
        if (a.isSelected && !b.isSelected) return -1;
        if (!a.isSelected && b.isSelected) return 1;

        // 2. Prioritize identical slot clashes (yellow) first
        if (a.hasSameSlotClash && !b.hasSameSlotClash) return -1;
        if (!a.hasSameSlotClash && b.hasSameSlotClash) return 1;

        // 3. Prioritize non-clashing over other clashes
        const aIsClashing = a.clashes.length > 0;
        const bIsClashing = b.clashes.length > 0;
        const aHasOtherClash = aIsClashing && !a.hasSameSlotClash;
        const bHasOtherClash = bIsClashing && !b.hasSameSlotClash;

        if (!aIsClashing && bHasOtherClash) return -1; // no clash before other clash
        if (aHasOtherClash && !bIsClashing) return 1; // no clash before other clash

        // 4. Sort by color preference - matching color filter comes first
        if (colorFilter) {
          const aMatchesColor = a.teacher.color === colorFilter;
          const bMatchesColor = b.teacher.color === colorFilter;
          if (aMatchesColor && !bMatchesColor) return -1;
          if (!aMatchesColor && bMatchesColor) return 1;
        }

        // 5. Sort alphabetically by color
        const colorCompare = a.teacher.color.localeCompare(b.teacher.color);
        if (colorCompare !== 0) return colorCompare;

        // 6. Finally, sort alphabetically by teacher name
        return a.teacher.name.localeCompare(b.teacher.name);
      });
  }, [
    courseTeachers,
    searchQuery,
    slotFilter,
    colorFilter,
    teacherSlotClash,
    isTeacherSelected,
    hasSameSlotClashWithSelected,
  ]);
}
