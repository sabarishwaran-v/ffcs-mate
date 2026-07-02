import parsedCourses from "./courses.json";

export interface Course {
  id: string;
  code: string;
  title: string;
  type: string;
  credits: number;
  category?: string; 
  slots?: string[];
  theorySlots?: string[];
  labSlots?: string[];
}

export const MOCK_COURSES: Course[] = parsedCourses
  .filter((c: any) => c.type !== "PJT") // Remove project courses (they have no slots)
  .map((c: any) => ({
    id: c.id,
    code: c.code,
    title: c.name, // Mapping 'name' from JSON to 'title'
    type: c.type,
    credits: c.credits,
    theorySlots: c.theorySlots,
    labSlots: c.labSlots
  }))
  .sort((a, b) => {
    // Keep Software Engineering and Database Systems at the very top for testing/demo purposes
    const topKeywords = ["software engineering", "database systems"];
    const aIsTop = topKeywords.some(keyword => a.title.toLowerCase().includes(keyword));
    const bIsTop = topKeywords.some(keyword => b.title.toLowerCase().includes(keyword));
    
    if (aIsTop && !bIsTop) return -1;
    if (!aIsTop && bIsTop) return 1;
    return 0;
  });

// Future-proofing: When real semester databases are added, this function will map
// the requested semester ID (e.g. "winter2025") to the correct JSON data import.
// For now, it just returns the default MOCK_COURSES.
export const getCoursesForSemester = (semester: string | null): Course[] => {
  if (!semester) return [];
  // if (semester === "winter2026") return WINTER_2026_COURSES;
  return MOCK_COURSES;
};
