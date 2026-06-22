"use client";

import { AlertCircle } from "lucide-react";
import { memo, useCallback } from "react";

import { MotionDiv, MotionTd } from "@/components/ui/motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { TimetableRenderData } from "@/types";

interface TimetableCellProps {
  slotNamesInCell: string[];
  slotIndex: number;
  dayIndex: number;
  cellData: TimetableRenderData["cellsData"][string][string];
  toggleSlot: (slot: string) => void;
}

export const TimetableCell = memo(function TimetableCell({
  slotNamesInCell,
  slotIndex,
  dayIndex,
  cellData,
  toggleSlot,
}: TimetableCellProps) {
  const { color, teacherName, venue, isClash, clashDetails, isSelectedManual } =
    cellData;

  const handleClick = useCallback(() => {
    slotNamesInCell.forEach(toggleSlot);
  }, [slotNamesInCell, toggleSlot]);

  const slotDisplayText = slotNamesInCell.join(" / ");

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <MotionTd
            suppressHydrationWarning
            className={cn(
              "p-2 text-xs text-center border h-24 max-h-24 overflow-hidden transition-colors duration-200 dark:border-gray-700 hover:cursor-pointer",
              isClash ? "bg-red-solid text-white" : color,
              isSelectedManual &&
                "bg-yellow-4 text-black-8 dark:bg-yellowdark-7 hover:bg-yellow-4 dark:hover:bg-yellowdark-7",
              isClash && "relative",
            )}
            onClick={handleClick}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 30,
              delay: slotIndex * 0.01 + dayIndex * 0.03,
            }}
          >
            {slotDisplayText}
            <MotionDiv
              className="mt-1 font-semibold"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {!isClash && (
                <>
                  <p>{teacherName}</p>
                  <p>{venue}</p>
                </>
              )}
            </MotionDiv>
            {isClash && (
              <MotionDiv
                className="absolute top-1 right-1"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                whileHover={{
                  rotate: [0, -10, 10, -10, 0],
                  transition: { duration: 0.5 },
                }}
              >
                <AlertCircle className="h-4 w-4 text-red-normal" />
              </MotionDiv>
            )}
          </MotionTd>
        </TooltipTrigger>
        {isClash && clashDetails && (
          <TooltipContent
            side="top"
            className="border-2 border-red-normal bg-red-ui text-red-normal"
          >
            <div className="p-1 text-xs">
              <p className="mb-1 font-bold">Slot Clash Detected!</p>
              {clashDetails.courses.map((course, i) => (
                <p key={i}>{course}</p>
              ))}
            </div>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
});
