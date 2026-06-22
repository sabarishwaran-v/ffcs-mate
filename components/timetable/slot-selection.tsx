"use client";

import { Check, ChevronUpIcon, Plus } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { manualSlotSelectionStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import {
  afternoonLabSlots,
  afternoonTheorySlots,
  morningLabSlots,
  morningTheorySlots,
} from "@/src/constants/slots";

import { AnimatedButton } from "../ui/button";
import {
  AnimatePresenceWrapper,
  MotionDiv,
  ScrollAnimation,
} from "../ui/motion";

const SlotButton = ({
  slot,
  isSelected,
  onClick,
  displayText,
}: {
  slot: string | string[];
  isSelected: boolean;
  onClick: () => void;
  displayText: string;
}) => (
  <AnimatedButton
    key={Array.isArray(slot) ? slot.join(",") : slot}
    variant={isSelected ? "default" : "outline"}
    className={cn(
      "flex items-center gap-1 px-3 py-1.5 rounded-md text-sm transition-all duration-500 basis-1/6",
      isSelected && "bg-yellow-ui text-yellow-normal",
    )}
    onClick={onClick}
  >
    {isSelected ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
    {displayText}
  </AnimatedButton>
);

const SlotGroup = ({
  slots,
  className,
  selectedSlots,
  toggleSlot,
}: {
  slots: string[] | string[][];
  className?: string;
  selectedSlots: string[];
  toggleSlot: (slot: string) => void;
}) => {
  const handleSlotClick = useCallback(
    (slot: string | string[]) => {
      if (Array.isArray(slot)) {
        slot.forEach((s) => toggleSlot(s));
      } else {
        toggleSlot(slot);
      }
    },
    [toggleSlot],
  );

  const isSlotSelected = useCallback(
    (slot: string | string[]) => {
      if (Array.isArray(slot)) {
        return selectedSlots.some((ss) => slot.some((s) => s === ss));
      }
      return selectedSlots.includes(slot);
    },
    [selectedSlots],
  );

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {slots.map((slot) => (
        <SlotButton
          key={Array.isArray(slot) ? slot.join(",") : slot}
          slot={slot}
          isSelected={isSlotSelected(slot)}
          onClick={() => handleSlotClick(slot)}
          displayText={Array.isArray(slot) ? slot.join(" / ") : slot}
        />
      ))}
    </div>
  );
};

export function SlotSelector() {
  const { manualSelectedSlots, toggleSlot, clearSelectedSlots } =
    manualSlotSelectionStore();
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const handleClearAll = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      clearSelectedSlots();
    },
    [clearSelectedSlots],
  );

  const slotSections = useMemo(
    () => [
      {
        title: "Morning Slots",
        slots: [
          { data: morningTheorySlots, className: "grid-cols-1" },
          { data: morningLabSlots, className: "grid-cols-2" },
        ],
      },
      {
        title: "Afternoon Slots",
        slots: [
          { data: afternoonTheorySlots, className: "grid-cols-1" },
          { data: afternoonLabSlots, className: "grid-cols-2" },
        ],
      },
    ],
    [],
  );

  return (
    <ScrollAnimation animation="fadeIn" duration={0.6} className="mb-6">
      <div className="border rounded-lg shadow-sm p-4">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={toggleExpanded}
        >
          <div className="flex items-center gap-2">
            <h2 className="font-bold">Manual Slot Selection</h2>
          </div>
          <div className="flex gap-2">
            <AnimatePresenceWrapper>
              {isExpanded && (
                <AnimatedButton
                  variant="red"
                  size="sm"
                  onClick={handleClearAll}
                >
                  Clear All
                </AnimatedButton>
              )}
            </AnimatePresenceWrapper>
            <AnimatedButton
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded();
              }}
              aria-label={isExpanded ? "Collapse slots" : "Expand slots"}
              className="transition-transform duration-200"
            >
              <ChevronUpIcon
                className={cn("w-4 h-4 transition-transform", {
                  "rotate-180": !isExpanded,
                })}
              />
            </AnimatedButton>
          </div>
        </div>
        <AnimatePresenceWrapper>
          {isExpanded && (
            <MotionDiv
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 30,
              }}
            >
              {slotSections.map((section, sectionIndex) => (
                <div key={section.title}>
                  <h3 className="p-2">{section.title}</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {section.slots.map((slotGroup, groupIndex) => (
                      <SlotGroup
                        key={`${sectionIndex}-${groupIndex}`}
                        slots={slotGroup.data}
                        className={slotGroup.className}
                        selectedSlots={manualSelectedSlots}
                        toggleSlot={toggleSlot}
                      />
                    ))}
                  </div>
                  {sectionIndex < slotSections.length - 1 && (
                    <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>
                  )}
                </div>
              ))}
            </MotionDiv>
          )}
        </AnimatePresenceWrapper>
      </div>
    </ScrollAnimation>
  );
}
