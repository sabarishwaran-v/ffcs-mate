import { memo } from "react";

import { LAB_HOURS, THEORY_HOURS } from "@/src/constants/timetable";

import { TimeRangeHeader } from "./timeslot-header";

interface TimetableHeaderProps {
  totalCredits: number;
}

export function ExportTimetableHeader({ totalCredits }: TimetableHeaderProps) {
  return (
    <div className="mb-4 text-center">
      <h1 className="text-xl font-bold">FFCS Timetable</h1>
      <p className="text-sm text-gray-600">Total Credits: {totalCredits}</p>
    </div>
  );
}

export const TimetableHeader = memo(function TimetableHeader() {
  return (
    <thead className="bg-gray-100 dark:bg-gray-900 font-bold">
      <tr>
        <th className="p-2 border">
          THEORY
          <br />
          HOURS
        </th>
        {THEORY_HOURS.map((hour, i) => (
          <TimeRangeHeader key={i} hour={hour} />
        ))}
      </tr>
      <tr>
        <th className="p-2 font-bold border">
          LAB
          <br />
          HOURS
        </th>
        {LAB_HOURS.map((hour, i) => (
          <TimeRangeHeader key={i} hour={hour} colSpan={hour.start ? 2 : 1} />
        ))}
      </tr>
    </thead>
  );
});
