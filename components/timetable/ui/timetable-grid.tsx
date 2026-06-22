import { manualSlotSelectionStore } from "@/lib/store";
import { days, timetableData } from "@/src/constants/timetable";
import type { TimetableRenderData } from "@/types";

import { TimetableCell } from "./timetable-cell";
import { TimetableHeader } from "./timetable-header";

interface TimetableGridProps {
  cellsData: TimetableRenderData["cellsData"];
}

export function TimetableGrid({ cellsData }: TimetableGridProps) {
  const { toggleSlot } = manualSlotSelectionStore();

  return (
    <div className="overflow-auto">
      <table className="w-full border-collapse rounded-lg shadow-sm border divide-gray-200 dark:divide-gray-700 overflow-hidden">
        <TimetableHeader />
        <tbody>
          {days.map((day, dayIndex) => (
            <tr key={dayIndex}>
              <td className="p-2 text-center font-bold border bg-gray-100 dark:bg-gray-900 dark:border-gray-700">
                {day}
              </td>
              {timetableData[day].map((slotNamesInCell, slotIndex) => {
                const cellKey = slotNamesInCell.join("/");
                const cellData = cellsData[day][cellKey];

                if (cellKey === "" && slotIndex === 6) {
                  return dayIndex === 0 ? (
                    <td
                      key={slotIndex}
                      className="p-2 text-center border bg-gray-100 dark:bg-gray-900 dark:border-gray-700"
                      rowSpan={5}
                    >
                      <div className="flex items-center justify-center h-16">
                        LUNCH
                      </div>
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
          ))}
        </tbody>
      </table>
    </div>
  );
}
