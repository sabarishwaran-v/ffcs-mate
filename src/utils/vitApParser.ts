import { Course } from '../store/useUserStore';

// Parses tab-separated data from VIT-AP Annexure II
// Format: COURSE CODE \t COURSE TITLE \t COURSE TYPE \t SLOT
export function parseVitApData(rawText: string): Course[] {
  const lines = rawText.split('\n').filter(line => line.trim() !== '');
  const parsedCourses: Course[] = [];

  lines.forEach(line => {
    // Tab separated is most common when copy-pasting from PDF/Excel
    let parts = line.split('\t').map(p => p.trim());
    
    // Fallback to multiple spaces if tabs aren't present
    if (parts.length < 4) {
      parts = line.split(/\s{2,}/).map(p => p.trim());
    }

    if (parts.length >= 4) {
      const code = parts[0];
      const title = parts[1];
      const type = parts[2];
      const slotString = parts[3];

      // Parse the slot string (e.g. "A+A1+TA+TA1")
      const slotArray = slotString.split('+').map(s => s.trim()).filter(Boolean);

      if (code && slotArray.length > 0) {
        parsedCourses.push({
          id: Math.random().toString(36).substr(2, 9),
          code: code.toUpperCase(),
          title: title,
          type: type,
          slots: slotArray,
          faculty: 'TBD (VIT-AP Mode)', // Explicitly state faculty is unknown
          venue: 'TBD',
          credits: 0, // Not provided in this format
        });
      }
    }
  });

  return parsedCourses;
}
