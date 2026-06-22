import { CourseSortMenu } from "../../ui/sort-menu";

interface CourseListHeaderProps {
  totalCourses: number;
  sortBy: "code" | "name";
  onSortChange: (value: "code" | "name") => void;
}

export function CourseListHeader({
  totalCourses,
  sortBy,
  onSortChange,
}: CourseListHeaderProps) {
  return (
    <div className="flex items-center justify-end mb-2 -mt-2">
      {totalCourses > 1 && (
        <CourseSortMenu
          value={sortBy}
          onChange={(v) => onSortChange(v as "code" | "name")}
        />
      )}
    </div>
  );
}
