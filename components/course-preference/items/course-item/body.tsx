import { useState, useEffect } from "react";
import { Course, Teacher } from "@/types";
import { useScheduleStore, useFacultyStore, useOptimisticStore } from "@/lib/store";
import { toast } from "sonner";
import { Check, CalendarPlus, CheckCircle2, UploadCloud, RotateCcw, FileCode } from "lucide-react";
import { MOCK_COURSES } from "@/lib/mock-data";
import { useAuth } from "@/components/providers/auth-provider";
import MockHtmlUploadModal from "./mock-html-upload-modal";
import { Button } from "@/components/ui/button";
import facultyData from "@/lib/faculties.json";

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
  const { optimisticFaculties, customCourseOverrides, removeCourseCustomOverride } = useOptimisticStore();
  const { user, userData } = useAuth();

  const [selectedTheoryId, setSelectedTheoryId] = useState<string | null>(null);
  const [selectedLabId, setSelectedLabId] = useState<string | null>(null);
  const [isContributeModalOpen, setIsContributeModalOpen] = useState(false);

  const hasCustomOverride = !!customCourseOverrides[course.code];
  const customOverrideData = customCourseOverrides[course.code];

  const mockCourse = MOCK_COURSES.find(c => c.id === course.id);
  const theorySlots = course.theorySlots || mockCourse?.theorySlots || [];
  const labSlots = course.labSlots || mockCourse?.labSlots || [];

  const dedupeTeachers = (list: Teacher[]) => {
    const seen = new Set<string>();
    return list.filter((t) => {
      const facName = (t.faculty || "").trim().toLowerCase();
      const morningVenue = (t.venue?.morning || "").trim().toLowerCase();
      const afternoonVenue = (t.venue?.afternoon || "").trim().toLowerCase();
      const key = `${t.name}_${facName}_${morningVenue}_${afternoonVenue}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const theoryTeachers = dedupeTeachers(
    courseTeachers.filter((t) => {
      const allSlots = [...(t.slots.morning || []), ...(t.slots.afternoon || [])];
      const isLab = allSlots.some((s) => s.startsWith("L") && /[0-9]/.test(s));
      return !isLab;
    })
  ).sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" })
  );

  const labTeachers = dedupeTeachers(
    courseTeachers.filter((t) => {
      const allSlots = [...(t.slots.morning || []), ...(t.slots.afternoon || [])];
      return allSlots.some((s) => s.startsWith("L") && /[0-9]/.test(s));
    })
  ).sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" })
  );

  const hasPublicFaculties = courseTeachers.some(t => t.faculty && t.faculty !== "-" && !hasCustomOverride);
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

  const allAvailableFaculties = hasCustomOverride
    ? { ...(customOverrideData?.faculties || {}) }
    : { ...optimisticFaculties, ...approvedFaculties };
  const approvedTeacherIds = Object.keys(allAvailableFaculties).join(',');

  const handleRevertToPublic = () => {
    removeCourseCustomOverride(course.code);

    const typedFacultyData = facultyData as Record<string, { faculty: string; venue: string }[]>;
    const publicApproved = Object.values(approvedFaculties).filter(af => af.courseCode === course.code);

    const publicTeachersToAdd: Teacher[] = [];
    if (publicApproved.length > 0) {
      publicApproved.forEach(af => {
        const id = af.id || `${course.code}_${af.slot}_${(af.faculty || '').replace(/[^a-zA-Z0-9]/g, '_')}`;
        const periods = (af.slot || "").split("+").map(s => s.trim()).filter(Boolean);
        const isLab = periods.some(s => s.startsWith("L") && /[0-9]/.test(s));
        publicTeachersToAdd.push({
          id,
          course: course.id,
          name: af.slot,
          faculty: af.faculty,
          color: isLab ? "#0ea5e9" : "#8b5cf6",
          slots: { morning: periods, afternoon: null },
          venue: { morning: af.venue || null, afternoon: null }
        });
      });
    } else {
      const allSlots = [...(course.theorySlots || mockCourse?.theorySlots || []), ...(course.labSlots || mockCourse?.labSlots || [])];
      allSlots.forEach((slotStr) => {
        const facultyKey = `${course.code}_${slotStr}`;
        const facs = typedFacultyData[facultyKey];
        const periods = (slotStr || "").split("+").map(s => s.trim()).filter(Boolean);
        const isLab = periods.some(s => s.startsWith("L") && /[0-9]/.test(s));
        if (facs && facs.length > 0) {
          facs.forEach((fac, fIndex) => {
            publicTeachersToAdd.push({
              id: `${course.id}-${slotStr}-f${fIndex}`,
              name: slotStr,
              color: isLab ? "#0ea5e9" : "#8b5cf6",
              faculty: fac.faculty,
              slots: { morning: periods, afternoon: null },
              venue: { morning: fac.venue || null, afternoon: null },
              course: course.id
            });
          });
        }
      });
    }

    const state = useScheduleStore.getState();
    const currentCourseTeacherIds = state.teachers.filter(t => t.course === course.id).map(t => t.id);
    state.removeTeachers(currentCourseTeacherIds);
    if (publicTeachersToAdd.length > 0) {
      state.addTeachers(publicTeachersToAdd);
    }
    toast.success(`Reverted ${course.code} to public faculty data.`);
  };

  useEffect(() => {
    let shouldAdd: Teacher[] = [];
    let shouldRemove: string[] = [];

    const stateTeachers = useScheduleStore.getState().teachers.filter(t => t.course === course.id);
    const courseApproved = Object.values(allAvailableFaculties).filter(af => af.courseCode === course.code);
    
    courseApproved.forEach(af => {
      // Check if we already have this faculty (by deterministic ID or locally parsed name/slot combo)
      const existsLocally = stateTeachers.find(t => 
        (af.id && t.id === af.id) || 
        (t.name === af.slot && (t.faculty || '').trim().toLowerCase() === (af.faculty || '').trim().toLowerCase())
      );
      if (!existsLocally) {
        // Inject globally approved faculty into this student's local list
        const template = stateTeachers.find(t => t.name === af.slot);
        const periods = (af.slot || "").split("+").map(s => s.trim()).filter(Boolean);
        const isLab = periods.some(s => s.startsWith("L") && /[0-9]/.test(s));
        const deterministicId = af.id || `${course.code}_${af.slot}_${(af.faculty || '').replace(/[^a-zA-Z0-9]/g, '_')}`;

        if (template) {
          shouldAdd.push({
            ...template,
            id: deterministicId,
            faculty: af.faculty,
            slots: {
              morning: template.slots.morning ? periods : null,
              afternoon: template.slots.afternoon ? periods : null,
            },
            venue: {
              morning: template.slots.morning ? af.venue : null,
              afternoon: template.slots.afternoon ? af.venue : null,
            },
            addedByName: "Verified Faculty",
          });
        } else {
          shouldAdd.push({
            id: deterministicId,
            course: course.id,
            name: af.slot,
            faculty: af.faculty,
            color: isLab ? "#0ea5e9" : "#8b5cf6",
            slots: { morning: periods, afternoon: null },
            venue: { morning: af.venue || null, afternoon: null },
            addedByName: "Verified Faculty",
          });
        }
      }
    });

    // Remove mock "-" teachers if we have real data (parsed or approved) for that slot
    const realTeacherSlots = new Set([
      ...stateTeachers.filter(t => t.faculty && t.faculty !== "-").map(t => t.name),
      ...shouldAdd.map(t => t.name)
    ]);
    
    stateTeachers.forEach(t => {
      if ((!t.faculty || t.faculty === "-") && realTeacherSlots.has(t.name)) {
        shouldRemove.push(t.id);
      }
      
      // Remove faculties that are no longer approved or belong to stale/previous semesters
      const typedFacultyData = facultyData as Record<string, { faculty: string; venue: string }[]>;
      if (
        (t.addedByName === "Verified Faculty" || (t.faculty && t.faculty !== "-")) &&
        t.addedByName !== "Custom HTML Upload" &&
        !hasCustomOverride
      ) {
        const stillApproved = courseApproved.find(af => 
          (af.id && af.id === t.id) || 
          (af.slot === t.name && (af.faculty || '').trim().toLowerCase() === (t.faculty || '').trim().toLowerCase())
        );
        const inLocalFaculties = (typedFacultyData[`${course.code}_${t.name}`] || []).some(
          f => f.faculty.trim().toLowerCase() === (t.faculty || '').trim().toLowerCase()
        );
        if (!stillApproved && !inLocalFaculties) {
          shouldRemove.push(t.id);
        }
      }
    });

    // Restore mock "-" teachers if a slot becomes completely empty
    const finalSlots = new Set();
    stateTeachers.forEach(t => {
      if (!shouldRemove.includes(t.id)) finalSlots.add(t.name);
    });
    shouldAdd.forEach(t => finalSlots.add(t.name));

    const allExpectedSlots = [...(course.theorySlots || mockCourse?.theorySlots || []), ...(course.labSlots || mockCourse?.labSlots || [])];
    const missingSlots = allExpectedSlots.filter(slot => !finalSlots.has(slot));

    missingSlots.forEach(slot => {
      const periods = (slot || "").split("+").map(s => s.trim()).filter(Boolean);
      const isLab = periods.some(s => s.startsWith("L") && /[0-9]/.test(s));
      shouldAdd.push({
        id: `${course.id}_${slot}`,
        name: slot,
        faculty: "-",
        color: isLab ? "#0ea5e9" : "#8b5cf6",
        slots: { morning: periods, afternoon: null },
        venue: { morning: null, afternoon: null },
        course: course.id,
        addedByName: "System"
      });
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
  }, [approvedTeacherIds, course.code, course.id]);

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

        {hasCustomOverride ? (
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30 flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5" /> Using Custom Mock Data
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRevertToPublic}
              className="text-xs h-7 px-2.5 flex items-center gap-1 border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
            >
              <RotateCcw className="w-3 h-3" /> Revert to Public
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsContributeModalOpen(true)}
            className="text-xs h-8 px-3 flex items-center gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            {hasPublicFaculties ? "Upload Custom HTML" : "Add Mock FFCS HTML"}
          </Button>
        )}
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
              const approvedObj = allAvailableFaculties[t.id] || allAvailableFaculties[deterministicId];
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
              const approvedObj = allAvailableFaculties[t.id] || allAvailableFaculties[deterministicId];
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

      <MockHtmlUploadModal 
        isOpen={isContributeModalOpen}
        onClose={() => setIsContributeModalOpen(false)}
        course={course}
      />
    </div>
  );
}
