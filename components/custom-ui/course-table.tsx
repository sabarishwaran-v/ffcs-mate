import { useScheduleStore } from "@/lib/store";

import { CourseRow } from "./course-row";

interface CoursesTableProps {
  totalCredits: number;
}

export function CoursesTable({ totalCredits }: CoursesTableProps) {
  const { getSelectedTeachers } = useScheduleStore();
  const selectedTeachers = getSelectedTeachers();

  return (
    <div className="mt-4">
      <h2 className="mb-2 text-lg font-bold">Selected Courses</h2>
      <table className="w-full overflow-hidden border border-collapse divide-gray-200 rounded-lg dark:divide-gray-700">
        <thead className="p-2 font-bold text-center bg-gray-100 select-none dark:bg-gray-900">
          <tr>
            <th className="p-2 border">Course Code</th>
            <th className="p-2 border">Course Name</th>
            <th className="p-2 border">Credits</th>
            <th className="p-2 border">Slots</th>
            <th className="p-2 border">Faculty</th>
            <th className="p-2 border">Venue</th>
          </tr>
        </thead>
        <tbody className="p-2 font-bold text-center bg-gray-100 border dark:bg-gray-900">
          {selectedTeachers.map((teacher) => (
            <CourseRow key={teacher.id} teacher={teacher} />
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-gray-100 dark:bg-gray-900 font-bold text-center">
            <td colSpan={2} className="p-2 text-right border">
              <strong>Total Credits:</strong>
            </td>
            <td className="p-2 text-center border">
              <strong>{totalCredits}</strong>
            </td>
            <td colSpan={3} className="p-2 border"></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
