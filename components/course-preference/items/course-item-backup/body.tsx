import { useState, useEffect } from "react";
import { Course, Teacher } from "@/types";
import { useScheduleStore } from "@/lib/store";
import { toast } from "sonner";
import { Check, CalendarPlus } from "lucide-react";
import { MOCK_COURSES } from "@/lib/mock-data";
import { useAuth } from "@/components/providers/auth-provider";

interface CourseItemBodyProps {
  course: Course;
  isExpanded: boolean;
  courseTeachers: Teacher[];
  onClose?: () => void;
}

export default function CourseItemBody({
  course,
  isExpanded,
  courseTeachers,
  onClose,
}: CourseItemBodyProps) {
  const { isTeacherSelected, setCourseSlots } = useScheduleStore();
  const { user, userData } = useAuth();

  const [selectedTheoryId, setSelectedTheoryId] = useState<string | null>(null);
  const [selectedLabId, setSelectedLabId] = useState<string | null>(null);

  const mockCourse = MOCK_COURSES.find((c) => c.id === course.id);
  const theorySlots = course.theorySlots || mockCourse?.theorySlots || [];
  const labSlots = course.labSlots || mockCourse?.labSlots || [];

  const theoryTeachers = courseTeachers.filter((t) =>
    theorySlots.includes(t.name)
  );
  const labTeachers = courseTeachers.filter((t) => labSlots.includes(t.name));

  const isEmbedded = theoryTeachers.length > 0 && labTeachers.length > 0;
  const requiresTheory = theoryTeachers.length > 0;
  const requiresLab = labTeachers.length > 0;

  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    if (hasInitialized) return;

    const placedTheory = theoryTeachers.find((t) => isTeacherSelected(t.id));
    const placedLab = labTeachers.find((t) => isTeacherSelected(t.id));

    if (placedTheory) setSelectedTheoryId(placedTheory.id);
    if (placedLab) setSelectedLabId(placedLab.id);

    setHasInitialized(true);
  }, [theoryTeachers, labTeachers, isTeacherSelected, hasInitialized]);

  const handleUpdateTimetable = () => {
    const slotsToPlace: string[] = [];
    if (selectedTheoryId) slotsToPlace.push(selectedTheoryId);
    if (selectedLabId) slotsToPlace.push(selectedLabId);

    if (requiresTheory && !selectedTheoryId) {
      toast.error("Please select a Theory slot.");
      return;
    }
    if (requiresLab && !selectedLabId) {
      toast.error("Please select a Lab slot.");
      return;
    }

    const result = setCourseSlots(
      course.id,
      slotsToPlace,
      user?.uid,
      userData?.name
    );
    if (!result.success) {
      toast.error(result.clashMessage || "Cannot place slots due to a clash");
    } else {
      toast.success("Timetable updated successfully!");
      if (onClose) onClose();
    }
  };

  const isCurrentlyPlaced = () => {
    const placedTheory = theoryTeachers.find((t) => isTeacherSelected(t.id));
    const placedLab = labTeachers.find((t) => isTeacherSelected(t.id));

    if (requiresTheory && requiresLab)
      return (
        placedTheory?.id === selectedTheoryId && placedLab?.id === selectedLabId
      );
    if (requiresTheory) return placedTheory?.id === selectedTheoryId;
    if (requiresLab) return placedLab?.id === selectedLabId;
    return false;
  };

  const isCourseInTimetable = () => {
    const placedTheory = theoryTeachers.find((t) => isTeacherSelected(t.id));
    const placedLab = labTeachers.find((t) => isTeacherSelected(t.id));
    return Boolean(placedTheory || placedLab);
  };

  return (
    <div className="bg-[#0f172a] flex flex-col max-h-[60vh] overflow-y-auto">
      {/* Theory Section */}
      {requiresTheory && (
        <div className="w-full">
          <div className="bg-[#1e293b]/50 px-4 py-2 border-b border-slate-700/50">
            <span className="text-xs font-bold text-sky-400 tracking-wider uppercase">
              {isEmbedded ? "Embedded Theory Slots" : "Theory Slots"}
            </span>
          </div>
          <div className="flex flex-col divide-y divide-slate-700/50">
            {theoryTeachers.map((t) => (
              <label
                key={t.id}
                className="flex items-center justify-between px-6 py-3 cursor-pointer hover:bg-slate-800/50 transition-colors"
              >
                <span className="text-sm font-medium text-slate-200">
                  {t.name}
                </span>
                <input
                  type="radio"
                  name={`theory-${course.id}`}
                  value={t.id}
                  checked={selectedTheoryId === t.id}
                  onChange={() => setSelectedTheoryId(t.id)}
                  className="w-4 h-4 accent-sky-500 cursor-pointer"
                />
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Lab Section */}
      {requiresLab && (
        <div className="w-full">
          <div className="bg-[#1e293b]/50 px-4 py-2 border-y border-slate-700/50 mt-2">
            <span className="text-xs font-bold text-sky-400 tracking-wider uppercase">
              Lab Slots
            </span>
          </div>
          <div className="flex flex-col divide-y divide-slate-700/50">
            {labTeachers.map((t) => (
              <label
                key={t.id}
                className="flex items-center justify-between px-6 py-3 cursor-pointer hover:bg-slate-800/50 transition-colors"
              >
                <span className="text-sm font-medium text-slate-200">
                  {t.name}
                </span>
                <input
                  type="radio"
                  name={`lab-${course.id}`}
                  value={t.id}
                  checked={selectedLabId === t.id}
                  onChange={() => setSelectedLabId(t.id)}
                  className="w-4 h-4 accent-sky-500 cursor-pointer"
                />
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Footer Action */}
      <div className="p-4 bg-[#0f172a] border-t border-slate-700/50 flex justify-end shrink-0 sticky bottom-0">
        <button
          onClick={handleUpdateTimetable}
          disabled={
            isCurrentlyPlaced() ||
            (!selectedTheoryId && requiresTheory) ||
            (!selectedLabId && requiresLab)
          }
          className="px-6 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all bg-sky-600 text-white hover:bg-sky-500 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed"
        >
          {isCurrentlyPlaced() ? (
            <>
              <Check className="w-4 h-4" /> Selected
            </>
          ) : isCourseInTimetable() ? (
            <>
              <CalendarPlus className="w-4 h-4" /> Modify
            </>
          ) : (
            <>
              <CalendarPlus className="w-4 h-4" /> Add to Timetable
            </>
          )}
        </button>
      </div>
    </div>
  );
}
