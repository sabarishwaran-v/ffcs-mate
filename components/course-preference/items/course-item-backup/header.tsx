import { Course } from "@/types";

import CourseItemActions from "./actions";

interface CourseItemHeaderProps {
  course: Course;
  isExpanded: boolean;
  toggleExpanded: () => void;
}

export default function CourseItemHeader({
  course,
  isExpanded,
  toggleExpanded,
}: CourseItemHeaderProps) {
  return (
    <div
      className="flex items-center justify-between p-3 cursor-pointer"
      onClick={toggleExpanded}
    >
      <div>
        <p className="font-medium">{course.code}</p>
        <p className="text-sm text-muted-foreground">
          {course.name} • {course.credits} Credits
        </p>
      </div>
      <div className="flex gap-2">
        <CourseItemActions course={course} isExpanded={isExpanded} />
      </div>
    </div>
  );
}
