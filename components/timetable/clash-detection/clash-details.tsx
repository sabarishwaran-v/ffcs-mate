"use client";

import { AlertCircle, Clock } from "lucide-react";
import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { MotionDiv, MotionLi } from "@/components/ui/motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useScheduleStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { ClashInfo } from "@/types";

interface ClashDetailsProps {
  clashes: ClashInfo[];
}

export function ClashDetails({ clashes }: ClashDetailsProps) {
  const { courses } = useScheduleStore();

  // Group clashes by slot for better visualization
  const groupedClashes = useMemo(() => {
    const grouped: Record<string, ClashInfo[]> = {};

    clashes.forEach((clash) => {
      if (!grouped[clash.slot]) {
        grouped[clash.slot] = [];
      }
      grouped[clash.slot].push(clash);
    });

    return grouped;
  }, [clashes]);

  return (
    <div
      key={"clash-details"}
      className="rounded-lg overflow-hidden border border-red-dim"
    >
      <div className={cn("p-3 border-b", "bg-red-ui border-red-dim")}>
        <h4
          className={cn("font-medium flex items-center gap-2", "text-red-dim")}
        >
          <AlertCircle className="h-4 w-4" />
          Clash Details
        </h4>
      </div>

      <ScrollArea className="max-h-[300px] overflow-x-auto p-3">
        {Object.entries(groupedClashes).map(
          ([slot, slotClashes], groupIndex) => (
            <MotionDiv
              key={slot + groupIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: groupIndex * 0.1 }}
              className="mb-4 last:mb-0"
            >
              <div className={cn("flex items-center gap-2 mb-2 text-red-dim")}>
                <Clock className="h-4 w-4" />
                <h5 className="font-medium">
                  Slot {slot} ({slotClashes.length} clash
                  {slotClashes.length > 1 ? "es" : ""})
                </h5>
              </div>

              <ul className="space-y-2 pl-6">
                {slotClashes.map((clash, index) => {
                  const course1 = courses.find(
                    (c) => c.id === clash.teacher1.course
                  );
                  const course2 = courses.find(
                    (c) => c.id === clash.teacher2.course
                  );

                  return (
                    <MotionLi
                      key={`${slot}-${clash.teacher1.id}-${clash.teacher2.id}-${index}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        duration: 0.3,
                        delay: index * 0.05 + groupIndex * 0.1,
                      }}
                      className="text-sm"
                    >
                      <div
                        className={cn(
                          "flex flex-col sm:flex-row sm:items-center gap-2 p-2 rounded-md",
                          "bg-red-ui"
                        )}
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <Badge
                            className={cn(
                              "rounded-full",
                              `bg-${clash.teacher1.color}-ui text-${clash.teacher1.color}-dim`
                            )}
                          >
                            {course1?.code || "Unknown"}
                          </Badge>
                          <span className="text-gray-700 dark:text-gray-300">
                            {clash.teacher1.name}
                          </span>
                        </div>

                        <div className="flex items-center justify-center">
                          <Badge
                            variant="outline"
                            className="bg-white dark:bg-gray-900"
                          >
                            clashes with
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2 flex-1">
                          <Badge
                            className={cn(
                              "rounded-full",
                              `bg-${clash.teacher2.color}-ui text-${clash.teacher2.color}-dim`
                            )}
                          >
                            {course2?.code || "Unknown"}
                          </Badge>
                          <span className="text-gray-700 dark:text-gray-300">
                            {clash.teacher2.name}
                          </span>
                        </div>
                      </div>
                    </MotionLi>
                  );
                })}
              </ul>
            </MotionDiv>
          )
        )}
      </ScrollArea>
    </div>
  );
}
