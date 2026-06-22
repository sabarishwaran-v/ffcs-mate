import { memo } from "react";

import { SearchIcon } from "@/components/icon-memo";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const SearchBar = memo(({ value, onChange }: SearchBarProps) => {
  return (
    <div className="relative mb-4">
      <SearchIcon />
      <Input
        placeholder="Search courses by code or name..."
        className="pl-8"
        value={value}
        onChange={onChange}
      />
    </div>
  );
});

SearchBar.displayName = "SearchBar";
