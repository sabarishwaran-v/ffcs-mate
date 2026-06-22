import { memo } from "react";

import { TimetableCell } from "@/components/timetable/ui/timetable-cell";
import { manualSlotSelectionStore } from "@/lib/store";
import { timetableData } from "@/src/constants/timetable";
import type { TimetableRenderData } from "@/types";

interface TimetableRowProps {
  day: string;
  dayIndex: number;
  cellsDataForDay: TimetableRenderData["cellsData"][string];
}

export const TimetableRow = memo(function TimetableRow({
  day,
  dayIndex,
  cellsDataForDay,
}: TimetableRowProps) {
  const { toggleSlot } = manualSlotSelectionStore(); // Keep toggleSlot here

  return (
    <tr>
      <td className="p-2 text-center font-bold border bg-gray-100 dark:bg-gray-900 dark:border-gray-700">
        {day}
      </td>
      {timetableData[day].map((slotNamesInCell, slotIndex) => {
        // Key for this specific cell (e.g., "A1/L1")
        const cellKey = slotNamesInCell.join("/");
        const cellData = cellsDataForDay[cellKey];

        // Handle lunch break
        if (cellKey === "" && slotIndex === 6) {
          return dayIndex === 0 ? (
            <td
              key={slotIndex}
              className="p-2 text-center border bg-gray-100 dark:bg-gray-900 dark:border-gray-700"
              rowSpan={5}
            >
              <div className="flex items-center justify-center h-16">LUNCH</div>
            </td>
          ) : null;
        }

        return (
          <TimetableCell
            key={cellKey}
            slotNamesInCell={slotNamesInCell}
            slotIndex={slotIndex}
            dayIndex={dayIndex}
            cellData={cellData}
            toggleSlot={toggleSlot}
          />
        );
      })}
    </tr>
  );
});
