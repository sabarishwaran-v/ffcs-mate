import { useScheduleStore } from "@/lib/store";
import { getCreditsFromSlotString } from "@/lib/ltpjc-parser";

export function useTotalCredits(): number {
  const { getSelectedTeachers, courses } = useScheduleStore();

  return getSelectedTeachers().reduce((total, teacher) => {
    const course = courses.find((c) => c.id === teacher.course);
    const componentCredits = getCreditsFromSlotString(teacher.name, course);
    return total + componentCredits;
  }, 0);
}
