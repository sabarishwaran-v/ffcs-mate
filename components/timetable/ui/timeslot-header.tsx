import { cn } from "@/lib/utils";
import type { TimeRange } from "@/types";

interface TimeRangeHeaderProps {
  hour: TimeRange;
  index?: number;
  colSpan?: number;
}

export function TimeRangeHeader({ hour, colSpan = 1 }: TimeRangeHeaderProps) {
  const renderContent = () => {
    if (hour.start.length > 1) {
      return (
        <>
          {hour.start}
          <br />
          to
          <br />
          {hour.end}
        </>
      );
    }

    if (hour.start.length === 1) {
      return <>-</>;
    }

    return <div className="flex items-center justify-center h-16">LUNCH</div>;
  };

  return (
    <th
      className={cn(
        "p-2 text-xs font-bold text-center border w-24 max-w-24",
        "bg-blue-ui text-blue-dim",
      )}
      colSpan={colSpan}
    >
      {renderContent()}
    </th>
  );
}
