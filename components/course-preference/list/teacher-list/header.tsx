import { useCallback } from "react";

import { DeleteDialog } from "@/components/course-preference/dialogs/delete-dialog";
import { TeacherDialog } from "@/components/course-preference/dialogs/teacher-dialog";
import { useScheduleStore } from "@/lib/store";
import { Course, Teacher } from "@/types";

export function TeacherListHeader({
  course,
  courseTeachers,
}: {
  course: Course;
  courseTeachers: Teacher[];
}) {
  const { deleteAllTeachersForCourse } = useScheduleStore();

  const handleDeleteAllTeachers = useCallback(() => {
    deleteAllTeachersForCourse(course.id);
  }, [course.id, deleteAllTeachersForCourse]);

  return (
    <div className="flex items-center justify-between mb-2">
      <p className="text-sm font-medium">Teachers ({courseTeachers.length})</p>
      <div className="flex items-center gap-2">
        <TeacherDialog
          variant="secondary"
          size="sm"
          course={course.id}
          buttonText="Add Teacher"
          buttonIcon={"add"}
        />
        {courseTeachers.length > 0 && (
          <DeleteDialog
            description={`Are you sure you want to remove ALL ${courseTeachers.length} teachers for ${course.code}?`}
            onConfirm={handleDeleteAllTeachers}
            buttonText="Clear Teachers"
            buttonDisabled={courseTeachers.length === 0}
          />
        )}
      </div>
    </div>
  );
}
