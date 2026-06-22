import { memo } from "react";

import { Badge } from "@/components/ui/badge";
import { MotionDiv } from "@/components/ui/motion";
import { cn } from "@/lib/utils";

const TeacherSlots = memo(
  ({ slots, color }: { slots: string[]; color: string }) => {
    return slots.map((slot, slotIndex) => {
      return (
        <MotionDiv
          key={slotIndex}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: slotIndex * 0.05 }}
        >
          <Badge
            variant="outline"
            className={cn(
              "border-none select-none rounded-full",
              `bg-${color}-solid text-white`,
            )}
          >
            {slot}
          </Badge>
        </MotionDiv>
      );
    });
  },
);
TeacherSlots.displayName = "TeacherSlots";

export default TeacherSlots;
