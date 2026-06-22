"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { ClashDetails } from "@/components/timetable/clash-detection/clash-details";
import { AnimatedButton } from "@/components/ui/button";
import { AnimatePresenceWrapper, MotionDiv } from "@/components/ui/motion";
import { useScheduleStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function ClashVisualization() {
  const { getSelectedTeachers, getAllClashesEnhanced } = useScheduleStore();
  const selectedTeachers = getSelectedTeachers();
  const [showDetails, setShowDetails] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Get all clashes in the current timetable
  const clashes = useMemo(
    () => getAllClashesEnhanced(selectedTeachers),
    [getAllClashesEnhanced, selectedTeachers]
  );

  // Count of clashes
  const clashCount = useMemo(() => clashes.length, [clashes]);

  // Handle client-side hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <AnimatePresenceWrapper mode="sync">
      {selectedTeachers.length > 0 && (
        <div className="mb-4" suppressHydrationWarning>
          <MotionDiv
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className={cn(
              "p-4 rounded-lg border flex items-center justify-between",
              clashCount > 0
                ? "bg-reda-ui border-reda-dim text-reda-dim"
                : "bg-greena-ui border-greena-dim text-greena-dim"
            )}
          >
            <div className="flex items-center gap-3">
              <MotionDiv
                animate={
                  clashCount > 0
                    ? {
                        scale: [1, 1.2, 1],
                        rotate: [-5, 0, 5, 0],
                        transition: { duration: 0.5, ease: "easeInOut" },
                      }
                    : {}
                }
              >
                {clashCount > 0 ? (
                  <AlertTriangle className={cn("h-6 w-6")} />
                ) : (
                  <CheckCircle2 className={cn("h-6 w-6")} />
                )}
              </MotionDiv>
              <div>
                <h3 className={cn("font-medium")}>
                  {clashCount > 0 ? "Slot Clashes Detected" : "No Slot Clashes"}
                </h3>
                <p className={cn("text-sm")}>
                  {clashCount > 0
                    ? `Found ${clashCount} clash${
                        clashCount > 1 ? "es" : ""
                      } in your timetable`
                    : "Your timetable is clash-free"}
                </p>
              </div>
            </div>
            {clashCount > 0 && isMounted && (
              <AnimatedButton
                variant="red"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? "Hide Details" : "Show Details"}
              </AnimatedButton>
            )}
          </MotionDiv>

          <AnimatePresenceWrapper mode="sync">
            {showDetails && clashCount > 0 && isMounted && (
              <MotionDiv
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-2"
                layout
              >
                <ClashDetails clashes={clashes} />
              </MotionDiv>
            )}
          </AnimatePresenceWrapper>
        </div>
      )}
    </AnimatePresenceWrapper>
  );
}
