import { X } from "lucide-react";
import { memo } from "react";

import { AnimatedButton } from "@/components/ui/button";
import { AnimatePresenceWrapper } from "@/components/ui/motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface SortMenuProps {
  value: string;
  onChange: (value: string) => void;
}

export type CustomSortMenuProps = SortMenuProps & {
  values: string[];
  placeholder: string;
};

export const CourseSortMenu = memo(({ value, onChange }: SortMenuProps) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Sort by" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="code">Sort by Code</SelectItem>
        <SelectItem value="name">Sort by Name</SelectItem>
      </SelectContent>
    </Select>
  );
});

CourseSortMenu.displayName = "CourseSortMenu";

export const CustomSortMenu = memo(
  ({ value, onChange, values, placeholder }: CustomSortMenuProps) => {
    return (
      <div className="flex items-center gap-2 mb-2">
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {values.map((val) => (
              <SelectItem key={val} value={val}>
                {val.charAt(0).toUpperCase() + val.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <AnimatePresenceWrapper>
          {value && (
            <AnimatedButton
              variant="ghost"
              size="icon"
              onClick={() => onChange("")}
              className="h-9 w-9 shrink-0"
            >
              <X className="h-4 w-4" />
            </AnimatedButton>
          )}
        </AnimatePresenceWrapper>
      </div>
    );
  },
);
CustomSortMenu.displayName = "CustomSortMenu";
