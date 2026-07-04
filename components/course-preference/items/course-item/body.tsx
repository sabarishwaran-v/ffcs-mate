import { useState, useEffect } from "react";
import { Course, Teacher } from "@/types";
import { useScheduleStore, useFacultyStore } from "@/lib/store";
import { toast } from "sonner";
import { Check, CalendarPlus, CheckCircle2 } from "lucide-react";
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
  const { approvedFaculties, fetchApprovedFaculties } = useFacultyStore();
  const { user, userData } = useAuth();

  const [selectedTheoryId, setSelectedTheoryId] = useState<string | null>(null);
  const [selectedLabId, setSelectedLabId] = useState<string | null>(null);

  const mockCourse = MOCK_COURSES.find(c => c.id === course.id);
  const theorySlots = course.theorySlots || mockCourse?.theorySlots || [];
  const labSlots = course.labSlots || mockCourse?.labSlots || [];

  const theoryTeachers = courseTeachers.filter((t) => {
    const allSlots = [...(t.slots.morning || []), ...(t.slots.afternoon || [])];
    const isLab = allSlots.some(s => s.startsWith('L') && /[0-9]/.test(s));
    return !isLab;
  }).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

  const labTeachers = courseTeachers.filter((t) => {
    const allSlots = [...(t.slots.morning || []), ...(t.slots.afternoon || [])];
    return allSlots.some(s => s.startsWith('L') && /[0-9]/.test(s));
  }).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

  const isEmbedded = theoryTeachers.length > 0 && labTeachers.length > 0;
  const requiresTheory = theoryTeachers.length > 0;
  const requiresLab = labTeachers.length > 0;

  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    fetchApprovedFaculties();
  }, [fetchApprovedFaculties]);

  useEffect(() => {
    if (hasInitialized) return;

    const placedTheory = theoryTeachers.find((t) => isTeacherSelected(t.id));
    const placedLab = labTeachers.find((t) => isTeacherSelected(t.id));

    if (placedTheory) setSelectedTheoryId(placedTheory.id);
    if (placedLab) setSelectedLabId(placedLab.id);
    
    setHasInitialized(true);
  }, [theoryTeachers, labTeachers, isTeacherSelected, hasInitialized]);

  const localTeacherIds = courseTeachers.map(t => t.id).join(',');
  const approvedTeacherIds = Object.keys(approvedFaculties).join(',');

  useEffect(() => {
    let shouldAdd: Teacher[] = [];
    let shouldRemove: string[] = [];

    const courseApproved = Object.values(approvedFaculties).filter(af => af.courseCode === course.code);
    
    courseApproved.forEach(af => {
      // Check if we already have this faculty (by deterministic ID or locally parsed name/slot combo)
      const existsLocally = courseTeachers.find(t => t.id === af.id || (t.name === af.slot && t.faculty === af.faculty));
      if (!existsLocally) {
        // Inject globally approved faculty into this student's local list
        const template = courseTeachers.find(t => t.name === af.slot);
        if (template) {
          shouldAdd.push({
            ...template,
            id: af.id,
            faculty: af.faculty,
            venue: {
              morning: template.slots.morning ? af.venue : null,
              afternoon: template.slots.afternoon ? af.venue : null,
            },
            addedByName: "Verified Faculty",
          });
        }
      }
    });

    // Remove mock "-" teachers if we have real data (parsed or approved) for that slot
    const realTeacherSlots = new Set([
      ...courseTeachers.filter(t => t.faculty && t.faculty !== "-").map(t => t.name),
      ...shouldAdd.map(t => t.name)
    ]);
    
    courseTeachers.forEach(t => {
      if ((!t.faculty || t.faculty === "-") && realTeacherSlots.has(t.name)) {
        shouldRemove.push(t.id);
      }
    });

    if (shouldAdd.length > 0 || shouldRemove.length > 0) {
      const store = useScheduleStore.getState();
      
      if (shouldAdd.length > 0) {
        store.addTeachers(shouldAdd);
      }
      
      if (shouldRemove.length > 0) {
        store.removeTeachers(shouldRemove);
      }
    }
  }, [approvedTeacherIds, course.code, localTeacherIds]);

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

    const result = setCourseSlots(course.id, slotsToPlace, user?.uid, userData?.name);
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
    
    if (requiresTheory && requiresLab) return placedTheory?.id === selectedTheoryId && placedLab?.id === selectedLabId;
    if (requiresTheory) return placedTheory?.id === selectedTheoryId;
    if (requiresLab) return placedLab?.id === selectedLabId;
    return false;
  };

  const isCourseInTimetable = () => {
    const placedTheory = theoryTeachers.find((t) => isTeacherSelected(t.id));
    const placedLab = labTeachers.find((t) => isTeacherSelected(t.id));
    return Boolean(placedTheory || placedLab);
  };

  if (course.type?.includes('PJT')) {
    return (
      <div className="flex flex-col max-h-[60vh] overflow-y-auto p-12 items-center text-center text-muted-foreground bg-secondary/10">
        <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
        </div>
        <h3 className="text-lg font-bold text-foreground">Project Course</h3>
        <p className="text-sm mt-2 max-w-sm">This is a Project course. It does not have any scheduled classes or timetable slots.</p>
        <p className="text-xs mt-4 font-semibold text-blue-500 bg-blue-500/10 px-3 py-1 rounded-full">Automatically counts towards your total credits</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col max-h-[60vh] overflow-y-auto">
      {/* Faculty Action Header */}
      <div className="bg-primary/5 p-4 border-b border-border flex justify-between items-center sticky top-0 z-10 backdrop-blur-sm">
        <div>
          <h4 className="text-sm font-bold text-foreground">Faculty Data</h4>
          <p className="text-xs text-muted-foreground">Select your preferred slots and faculties</p>
        </div>
      </div>

      {/* Theory Section */}
      {requiresTheory && (
        <div className="w-full">
          <div className="bg-secondary/30 px-6 py-2 border-b border-border grid grid-cols-[1.5fr_3fr_1.5fr_24px] gap-4 items-center">
            <span className="text-xs font-bold text-primary tracking-wider uppercase">
              {isEmbedded ? "Theory Slots" : "Theory Slots"}
            </span>
            <span className="text-xs font-bold text-primary tracking-wider uppercase">
              Faculty
            </span>
            <span className="text-xs font-bold text-primary tracking-wider uppercase">
              Venue
            </span>
            <span></span>
          </div>
          <div className="flex flex-col divide-y divide-border">
            {theoryTeachers.map((t) => {
              const deterministicId = `${course.code}_${t.name}_${(t.faculty || '').replace(/\s+/g, '_')}`;
              const approvedObj = approvedFaculties[t.id] || approvedFaculties[deterministicId];
              return (
              <label
                key={t.id}
                className="grid grid-cols-[1.5fr_3fr_1.5fr_24px] gap-4 items-center px-6 py-3 cursor-pointer hover:bg-secondary/50 transition-colors group"
              >
                <span className="text-sm font-bold text-foreground">
                  {t.name}
                </span>
                
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="text-sm font-medium text-foreground truncate">
                    {approvedObj ? (
                      approvedObj.faculty
                    ) : (
                      t.faculty || "-"
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="text-sm font-medium text-muted-foreground truncate">
                    {t.venue.morning || t.venue.afternoon || "-"}
                  </span>
                </div>
                
                <div className="flex justify-end">
                  <input
                    type="radio"
                    name={`theory-${course.id}`}
                    value={t.id}
                    checked={selectedTheoryId === t.id}
                    onChange={() => setSelectedTheoryId(t.id)}
                    className="w-4 h-4 accent-sky-500 cursor-pointer"
                  />
                </div>
              </label>
            )})}
          </div>
        </div>
      )}

      {/* Lab Section */}
      {requiresLab && (
        <div className="w-full">
          <div className="bg-secondary/30 px-6 py-2 border-y border-border mt-2 grid grid-cols-[1.5fr_3fr_1.5fr_24px] gap-4 items-center">
            <span className="text-xs font-bold text-primary tracking-wider uppercase">
              Lab Slots
            </span>
            <span className="text-xs font-bold text-primary tracking-wider uppercase">
              Faculty
            </span>
            <span className="text-xs font-bold text-primary tracking-wider uppercase">
              Venue
            </span>
            <span></span>
          </div>
          <div className="flex flex-col divide-y divide-border">
            {labTeachers.map((t) => {
              const deterministicId = `${course.code}_${t.name}_${(t.faculty || '').replace(/\s+/g, '_')}`;
              const approvedObj = approvedFaculties[t.id] || approvedFaculties[deterministicId];
              return (
              <label
                key={t.id}
                className="grid grid-cols-[1.5fr_3fr_1.5fr_24px] gap-4 items-center px-6 py-3 cursor-pointer hover:bg-secondary/50 transition-colors group"
              >
                <span className="text-sm font-bold text-foreground">
                  {t.name}
                </span>

                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="text-sm font-medium text-foreground truncate">
                    {approvedObj ? (
                      approvedObj.faculty
                    ) : (
                      t.faculty || "-"
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="text-sm font-medium text-muted-foreground truncate">
                    {t.venue.morning || t.venue.afternoon || "-"}
                  </span>
                </div>

                <div className="flex justify-end">
                  <input
                    type="radio"
                    name={`lab-${course.id}`}
                    value={t.id}
                    checked={selectedLabId === t.id}
                    onChange={() => setSelectedLabId(t.id)}
                    className="w-4 h-4 accent-sky-500 cursor-pointer"
                  />
                </div>
              </label>
            )})}
          </div>
        </div>
      )}

      {/* Footer Action */}
      <div className="p-4 bg-background/95 backdrop-blur-md border-t border-border flex justify-end shrink-0 sticky bottom-0">
        <button
          onClick={handleUpdateTimetable}
          disabled={isCurrentlyPlaced() || (!selectedTheoryId && requiresTheory) || (!selectedLabId && requiresLab)}
          className="px-6 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-secondary disabled:text-muted-foreground disabled:cursor-not-allowed"
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
