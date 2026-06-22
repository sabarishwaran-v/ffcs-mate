import { useScheduleStore } from "@/lib/store";
import { getAllSlots } from "@/src/utils/timetable";
import { Teacher } from "@/types";
import { getCreditsFromSlotString } from "@/lib/ltpjc-parser";

interface CourseRowProps {
  teacher: Teacher;
}

export function CourseRow({ teacher }: CourseRowProps) {
  const { courses } = useScheduleStore();
  const course = courses.find((c) => c.id === teacher.course);

  // Get all slots for display
  const allSlots: string[] = getAllSlots(teacher);

  // Dynamically calculate credits for this specific component
  const componentCredits = getCreditsFromSlotString(teacher.name, course);

  // Get venue for display (prefer morning, fallback to afternoon)
  const venue = [
    teacher.venue.morning && `M: ${teacher.venue.morning}`,
    teacher.venue.afternoon && `A: ${teacher.venue.afternoon}`,
  ]
    .filter(Boolean)
    .join(" | ");

  return (
    <tr>
      <td className="p-2 border">{course?.code}</td>
      <td className="p-2 border">{course?.name}</td>
      <td className="p-2 text-center border">{componentCredits}</td>
      <td className="p-2 border">{teacher.name}</td>
      <td className="p-2 border"></td>
      <td className="p-2 border">{venue}</td>
    </tr>
  );
}
