import { useMemo } from "react";

import { getAllSlots } from "@/src/utils/timetable";
import { Teacher } from "@/types";

import { SearchBar } from "../../ui/search-bar";
import { CustomSortMenu } from "../../ui/sort-menu";

export function TeacherFilters({
  searchQuery,
  setSearchQuery,
  slotFilter,
  setSlotFilter,
  colorFilter,
  setColorFilter,
  courseTeachers,
}: {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  slotFilter: string;
  setSlotFilter: (v: string) => void;
  colorFilter: string;
  setColorFilter: (v: string) => void;
  courseTeachers: Teacher[];
}) {
  const availableColors = useMemo(() => {
    return Array.from(new Set(courseTeachers.map((t) => t.color))).sort();
  }, [courseTeachers]);

  const availableSlots = useMemo(() => {
    const slots = new Set<string>();
    courseTeachers.forEach((teacher) => {
      const allSlots: string[] = getAllSlots(teacher);

      allSlots.forEach((slot) => {
        if (slot.startsWith("L")) {
          const slotNumber = parseInt(slot.slice(1), 10);
          if (slotNumber % 2 === 1) {
            slots.add(`L${slotNumber} + L${slotNumber + 1}`);
          }
        } else {
          slots.add(slot);
        }
      });
    });
    return Array.from(slots).sort((a, b) => {
      const getSlotInfo = (slot: string) => {
        if (slot.includes("+")) {
          const firstSlot = slot.split(" + ")[0];
          const type = firstSlot.charAt(0);
          const number = parseInt(firstSlot.slice(1), 10);
          return { type, number };
        } else {
          const type = slot.charAt(0);
          const number = parseInt(slot.slice(1), 10) || 0;
          return { type, number };
        }
      };

      const aInfo = getSlotInfo(a);
      const bInfo = getSlotInfo(b);

      if (aInfo.type !== bInfo.type) {
        if (aInfo.type === "T" && bInfo.type === "L") return -1;
        if (aInfo.type === "L" && bInfo.type === "T") return 1;
        if (aInfo.type === "T" && bInfo.type === "T")
          return aInfo.number - bInfo.number;
      }

      return aInfo.number - bInfo.number;
    });
  }, [courseTeachers]);

  return (
    <div className="flex mb-2 flex-col w-full gap-2">
      <SearchBar
        value={searchQuery}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setSearchQuery(e.target.value)
        }
      />
      <CustomSortMenu
        value={colorFilter}
        onChange={setColorFilter}
        values={availableColors}
        placeholder="Filter by Color"
      />
      <CustomSortMenu
        value={slotFilter}
        onChange={setSlotFilter}
        values={availableSlots}
        placeholder="Filter by Slots"
      />
    </div>
  );
}
