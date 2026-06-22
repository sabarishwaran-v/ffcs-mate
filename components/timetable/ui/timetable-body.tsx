import { memo } from "react";

import { TimetableRow } from "@/components/timetable/ui/timetable-row";
import { days } from "@/src/constants/timetable";
import type { TimetableRenderData } from "@/types";

interface TimetableBodyProps {
  cellsData: TimetableRenderData["cellsData"];
}

export const TimetableBody = memo(function TimetableBody({
  cellsData,
}: TimetableBodyProps) {
  return (
    <tbody>
      {days.map((day, dayIndex) => (
        <TimetableRow
          key={day}
          day={day}
          dayIndex={dayIndex}
          cellsDataForDay={cellsData[day]}
        />
      ))}
    </tbody>
  );
});
