import { CourseData } from '../store/useUserStore';

// Parses tab-separated data pasted from VTOP course selection tables
// Typical format: SLOT \t VENUE \t FACULTY NAME \t AVAILABILITY
export function parseVTOPData(rawText: string, courseCode: string): CourseData[] {
  const lines = rawText.split('\n').filter(line => line.trim() !== '');
  const parsedCourses: CourseData[] = [];

  lines.forEach(line => {
    // Try to split by tab, fallback to multiple spaces
    let parts = line.split('\t').map(p => p.trim());
    if (parts.length < 3) {
      parts = line.split(/\s{2,}/).map(p => p.trim());
    }

    // We expect at least Slot, Venue, Faculty
    if (parts.length >= 3) {
      const slotString = parts[0];
      const venue = parts[1];
      const faculty = parts[2];
      
      // Determine if it's a lab slot (L1, L31, etc.)
      const isLab = slotString.includes('L') && /[0-9]/.test(slotString);

      // Parse the slot string (e.g. "A+A1+TA+TA1")
      const slotArray = slotString.split('+').map(s => s.trim()).filter(Boolean);

      if (slotArray.length > 0 && !slotString.toLowerCase().includes('slot')) {
        parsedCourses.push({
          id: Math.random().toString(36).substr(2, 9),
          code: courseCode,
          title: 'Course', // We don't have title here, but we could pass it down
          type: isLab ? 'Embedded Lab' : 'Embedded Theory',
          slots: slotArray,
          fullSlotString: slotString,
          faculty: faculty,
          venue: venue,
          credits: 0,
          isLab: isLab
        });
      }
    }
  });

  return parsedCourses;
}
