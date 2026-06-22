import { SearchBar } from "../../ui/search-bar";

interface CourseFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export function CourseFilters({
  searchQuery,
  onSearchChange,
}: CourseFiltersProps) {
  return (
    <SearchBar
      value={searchQuery}
      onChange={(e) => onSearchChange(e.target.value)}
    />
  );
}
