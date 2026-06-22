import EmptyState from "@/components/empty-state";
import { AnimatePresenceWrapper, MotionUl } from "@/components/ui/motion";
import { useFilteredTeachers } from "@/src/hooks/useFilteredTeachers";
import { Teacher } from "@/types";

import TeacherItem from "../../items/teacher-item/teacher-item";

export function TeacherListContent({
  courseTeachers,
  searchQuery,
  slotFilter,
  colorFilter,
}: {
  courseTeachers: Teacher[];
  searchQuery: string;
  slotFilter: string;
  colorFilter: string;
}) {
  const filteredTeachers = useFilteredTeachers(
    courseTeachers,
    searchQuery,
    slotFilter,
    colorFilter,
  );

  if (courseTeachers.length === 0)
    return (
      <EmptyState text="No teachers selected. Add teachers to see them here." />
    );

  if (filteredTeachers.length === 0)
    return <EmptyState text="No teachers match your search or filters." />;

  return (
    <AnimatePresenceWrapper>
      <MotionUl
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="space-y-3"
        layout
      >
        {filteredTeachers.map(
          ({ teacher, clashes, hasSameSlotClash, isSelected }, index) => (
            <TeacherItem
              key={teacher.id}
              teacher={teacher}
              clashedTeachers={clashes}
              hasSameSlotClash={hasSameSlotClash}
              isSelected={isSelected}
              index={index}
              className={clashes.length > 0 ? "opacity-50" : ""}
            />
          ),
        )}
      </MotionUl>
    </AnimatePresenceWrapper>
  );
}
