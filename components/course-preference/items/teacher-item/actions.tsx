import { Check, Plus } from "lucide-react";
import { memo, useCallback } from "react";

import { AnimatedButton } from "@/components/ui/button";
import { useScheduleStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useEditProvider } from "@/src/hooks/useEditProvider";
import { Teacher } from "@/types";

import { DeleteDialog } from "../../dialogs/delete-dialog";
import { TeacherDialog } from "../../dialogs/teacher-dialog";

interface TeacherItemActionsProps {
  teacher: Teacher;
  isSelected: boolean;
  hasClash: boolean;
}

export default function TeacherItemActions({
  teacher,
  isSelected,
  hasClash,
}: TeacherItemActionsProps) {
  const { editMode } = useEditProvider();
  return (
    <>
      {editMode ? (
        <EditActions teacher={teacher} />
      ) : (
        <NonEditActions
          teacher={teacher}
          isSelected={isSelected}
          hasClash={hasClash}
        />
      )}
    </>
  );
}

const EditActions = memo(({ teacher }: { teacher: Teacher }) => {
  const removeTeacher = useScheduleStore((state) => state.removeTeacher);

  const handleRemove = useCallback(() => {
    removeTeacher(teacher.id);
  }, [teacher.id, removeTeacher]);

  return (
    <>
      <TeacherDialog
        teacherToEdit={teacher}
        variant="yellowSolid"
        size="icon"
        buttonIcon="edit"
      />
      <DeleteDialog
        description="Are you sure you want to remove this teacher?"
        onConfirm={handleRemove}
        size={"icon"}
        useSolid
      />
    </>
  );
});
EditActions.displayName = "EditActions";

const NonEditActions = memo(
  ({
    teacher,
    isSelected,
    hasClash,
  }: {
    teacher: Teacher;
    isSelected: boolean;
    hasClash: boolean;
  }) => {
    const { toggleTeacherInTimetable } = useScheduleStore();

    const handleButtonClick = useCallback(() => {
      toggleTeacherInTimetable(teacher.id);
    }, [teacher.id, toggleTeacherInTimetable]);

    return (
      <AnimatedButton
        key={`${teacher.id}-${isSelected}`}
        variant={isSelected ? "default" : "outline"}
        className={cn(
          "h-8 w-8",
          isSelected
            ? `bg-${teacher.color}-solid text-white`
            : `text-${teacher.color}-dim`,
          hasClash && isSelected && `bg-red-solid text-white`,
        )}
        onClick={handleButtonClick}
      >
        {isSelected ? (
          <Check className="w-4 h-4" />
        ) : (
          <Plus className="w-4 h-4" />
        )}
      </AnimatedButton>
    );
  },
);
NonEditActions.displayName = "NonEditActions";
