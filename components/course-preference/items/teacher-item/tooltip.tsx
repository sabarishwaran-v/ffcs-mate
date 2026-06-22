import { AlertCircle } from "lucide-react";
import { memo } from "react";

import { MotionDiv } from "@/components/ui/motion";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useScheduleStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Teacher } from "@/types";

const TeacherClashTooltip = memo(
  ({
    clashedTeachers,
    identicalSlotClash,
  }: {
    clashedTeachers: Teacher[];
    identicalSlotClash: boolean;
  }) => {
    const getCourse = useScheduleStore((state) => state.getCourse);

    if (clashedTeachers.length === 0) return null;

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <MotionDiv
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            whileHover={{
              rotate: [0, -10, 10, -10, 0],
              transition: { duration: 0.5 },
            }}
          >
            <AlertCircle
              className={cn(
                identicalSlotClash ? "text-yellow-dim" : "text-red-dim",
              )}
            />
          </MotionDiv>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className={cn(
            "border-2 p-1",
            identicalSlotClash
              ? "bg-yellow-ui text-yellow-normal border-yellow-normal"
              : "bg-red-ui text-red-normal border-red-normal",
          )}
        >
          <div className="p-1">
            <p className="font-bold mb-1">
              {identicalSlotClash ? "Identical Slot Clash!" : "Slot Clash!"}
            </p>
            <div className="text-xs">
              {clashedTeachers.map((t, i) => {
                const course = getCourse(t.course);
                return (
                  <p key={i}>
                    Clashes with {t.name} ({course?.code})
                  </p>
                );
              })}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  },
);
TeacherClashTooltip.displayName = "TeacherClashTooltip";

export default TeacherClashTooltip;
