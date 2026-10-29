/**
 * Universal Client & Server Mock FFCS HTML Parser with Comprehensive Exception Diagnostics
 * Extracts Course Details, Slots, Faculties, and Venues from VTOP Mock FFCS HTML files.
 */

export interface ParsedOffering {
  slot: string;
  faculty: string;
  venue: string;
}

export interface ParsedMockCourse {
  courseCode: string;
  courseTitle: string;
  courseType: string;
  credits: number;
  semesterMismatch: boolean;
  semesterNote?: string;
  theoryOfferings: ParsedOffering[];
  labOfferings: ParsedOffering[];
}

export type ParseErrorCode =
  | 'EMPTY_FILE'
  | 'FILE_TOO_LARGE'
  | 'LOGIN_PAGE'
  | 'TIMETABLE_PAGE_NOT_REGISTRATION'
  | 'NO_VTOP_COURSE_DATA'
  | 'SEMESTER_MISMATCH'
  | 'NO_OFFERINGS_FOUND';

export interface ParseError {
  code: ParseErrorCode;
  title: string;
  message: string;
  suggestion: string;
}

export interface ParseResult {
  success: boolean;
  data?: ParsedMockCourse;
  error?: ParseError;
}

/**
 * Detailed parser with comprehensive error classification for all edge cases
 */
export function parseMockHtmlDetailed(htmlContent: string): ParseResult {
  // 1. Check Empty Content
  if (!htmlContent || typeof htmlContent !== 'string' || htmlContent.trim().length === 0) {
    return {
      success: false,
      error: {
        code: 'EMPTY_FILE',
        title: 'Empty File',
        message: 'The uploaded file is completely empty (0 bytes).',
        suggestion: 'Please verify the file on your device and re-save the page from VTOP.',
      },
    };
  }

  // 2. Strip HTML comments to avoid matching commented-out elements
  const cleanContent = htmlContent.replace(/<!--[\s\S]*?-->/g, '');

  // 3. Detect VTOP Login Page (Session Timeout / Not Logged In)
  const isLoginPage =
    /<title>[^<]*Login[^<]*<\/title>/i.test(cleanContent) ||
    /name=["'](txtUserName|txtPassword|captcha)["']/i.test(cleanContent) ||
    /id=["'](txtUserName|txtPassword|captcha)["']/i.test(cleanContent) ||
    (/vtop\s*login/i.test(cleanContent) && !cleanContent.includes('COURSE DETAIL'));

  if (isLoginPage) {
    return {
      success: false,
      error: {
        code: 'LOGIN_PAGE',
        title: 'VTOP Session Expired',
        message: 'The uploaded HTML file is the VTOP Login screen rather than a course registration page.',
        suggestion: 'Log in to VTOP, open the course in Mock FFCS registration to view its slot list, and then press Ctrl+S (or Cmd+S) to save the page.',
      },
    };
  }

  // 4. Detect Timetable Grid View instead of Course Detail
  const isTimetableGridView =
    (/Time\s*Table\s*View/i.test(cleanContent) || /class=["']timeTable["']/i.test(cleanContent)) &&
    !cleanContent.includes('COURSE DETAIL') &&
    !cleanContent.includes('courseCodehid');

  if (isTimetableGridView) {
    return {
      success: false,
      error: {
        code: 'TIMETABLE_PAGE_NOT_REGISTRATION',
        title: 'Wrong Screen Saved',
        message: 'This appears to be your overall Timetable Grid screen rather than a specific course registration popup.',
        suggestion: 'In Mock FFCS, click on the specific subject to open its Theory/Lab offerings table, then save that page.',
      },
    };
  }

  // 5. Extract Course Code
  let courseCode: string | null = null;
  const hiddenCodeMatch =
    cleanContent.match(/id=["']courseCodehid["'][^>]*value=["']([A-Z0-9]+)["']/i) ||
    cleanContent.match(/value=["']([A-Z0-9]+)["'][^>]*id=["']courseCodehid["']/i);
  if (hiddenCodeMatch) {
    courseCode = hiddenCodeMatch[1].trim().toUpperCase();
  }

  // 6. Extract Course Detail Header & Title
  let courseTitle = '';
  let courseType = '';
  const detailHeaderMatch = cleanContent.match(
    /COURSE\s+DETAIL[\s\S]*?<span>([A-Z]{3,4}\d{4})\s*-\s*([^<]+?)(?:\s*-\s*([^<]+))?<\/span>/i
  );

  if (detailHeaderMatch) {
    if (!courseCode) courseCode = detailHeaderMatch[1].trim().toUpperCase();
    courseTitle = detailHeaderMatch[2].trim();
    courseType = detailHeaderMatch[3] ? detailHeaderMatch[3].trim() : '';
  } else {
    // Fallback match for course line
    const fallbackMatch = cleanContent.match(
      /<span>([A-Z]{3,4}\d{4})\s*-\s*([^<]+?)(?:\s*-\s*([^<]+))?<\/span>/i
    );
    if (fallbackMatch && !fallbackMatch[1].startsWith('26BCE')) {
      if (!courseCode) courseCode = fallbackMatch[1].trim().toUpperCase();
      courseTitle = fallbackMatch[2].trim();
      courseType = fallbackMatch[3] ? fallbackMatch[3].trim() : '';
    }
  }

  if (!courseCode) {
    return {
      success: false,
      error: {
        code: 'NO_VTOP_COURSE_DATA',
        title: 'Unrecognized HTML Document',
        message: 'Could not find any VIT-AP course registration table or course code in this file.',
        suggestion: 'Make sure this file was saved directly from the official VIT-AP Mock FFCS registration portal.',
      },
    };
  }

  // 7. Extract Credits (L T P J C)
  let credits = 4;
  const ltpjcMatch =
    cleanContent.match(/<span>(\d)\s+(\d)\s+(\d)\s+(\d)\s+(\d+(?:\.\d+)?)<\/span>/i) ||
    cleanContent.match(/(\d)\s+(\d)\s+(\d)\s+(\d)\s+(\d+(?:\.\d+)?)/);
  if (ltpjcMatch) {
    credits = parseFloat(ltpjcMatch[5]) || 4;
  }

  // 8. Check Semester Mismatch
  let semesterMismatch = false;
  let semesterNote: string | undefined = undefined;

  const isExplicitOlderFall = /semfallreg|fall\s*2025|fall\s*semester\s*2025|fall\s*2026-27/i.test(cleanContent);
  if (isExplicitOlderFall) {
    semesterMismatch = true;
    semesterNote = 'This file appears to be from a previous Fall semester instead of Winter 2026-27.';
    return {
      success: false,
      error: {
        code: 'SEMESTER_MISMATCH',
        title: 'Semester Mismatch',
        message: semesterNote,
        suggestion: 'Please open the current Winter Semester 2026-27 Mock FFCS registration on VTOP and save that page.',
      },
    };
  }

  // 9. Extract Theory and Lab Offerings
  const theoryOfferings: ParsedOffering[] = [];
  const labOfferings: ParsedOffering[] = [];

  const sections = cleanContent.split(/<td[^>]*class=["']component-header-ribbon["'][^>]*>/i);

  if (sections.length > 1) {
    for (let i = 1; i < sections.length; i++) {
      const sectionHtml = sections[i];
      const headerMatch = sectionHtml.match(/^\s*(?:<div>)?([^<]+)/i);
      const sectionName = headerMatch ? headerMatch[1].trim().toLowerCase() : '';
      const isLab = sectionName.includes('lab');

      extractRows(sectionHtml, isLab ? labOfferings : theoryOfferings);
    }
  } else {
    const hasLabSection = /LAB\s+SLOTS/i.test(cleanContent);
    if (hasLabSection) {
      const parts = cleanContent.split(/LAB\s+SLOTS/i);
      extractRows(parts[0], theoryOfferings);
      extractRows(parts[1], labOfferings);
    } else {
      extractRows(cleanContent, theoryOfferings);
    }
  }

  function extractRows(htmlSection: string, fallbackTarget?: ParsedOffering[]) {
    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let match;
    while ((match = rowRegex.exec(htmlSection)) !== null) {
      const rowContent = match[1];
      if (
        rowContent.includes('<th') ||
        rowContent.includes('component-header-ribbon') ||
        rowContent.includes('COURSE CATEGORY')
      ) {
        continue;
      }

      const cells: string[] = [];
      const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
      let cellMatch;
      while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
        cells.push(cellMatch[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim());
      }

      if (cells.length >= 3) {
        const slotCandidate = cells[0];
        const isLabSlot = /^L\d+(?:\+L\d+)*$/i.test(slotCandidate);
        const isTheorySlot = /^(?:[A-G][1-2]|S[C-E][1-2]|CLUB|ECS)(?:\+[A-Z0-9]+)*$/i.test(slotCandidate);

        if (isLabSlot || isTheorySlot) {
          let venueCandidate = '';
          let facultyCandidate = '';

          for (let c = 1; c < cells.length; c++) {
            const cell = cells[c];
            if (/[A-Z0-9]+-[A-Z0-9]+(?:-[A-Z0-9]+)?/i.test(cell) || /^ONL/i.test(cell) || /^LAB/i.test(cell)) {
              venueCandidate = cell;
              if (c + 1 < cells.length) {
                facultyCandidate = cells[c + 1];
              }
              break;
            }
          }

          if (!venueCandidate && cells.length >= 3) {
            venueCandidate = cells[1];
            facultyCandidate = cells[2];
          }

          facultyCandidate = facultyCandidate.replace(/\s+\d+$/, '').trim();

          if (slotCandidate && facultyCandidate && facultyCandidate !== '-') {
            const offering: ParsedOffering = {
              slot: slotCandidate,
              faculty: facultyCandidate,
              venue: venueCandidate || 'TBA',
            };

            if (isLabSlot) {
              labOfferings.push(offering);
            } else if (isTheorySlot) {
              theoryOfferings.push(offering);
            } else if (fallbackTarget) {
              fallbackTarget.push(offering);
            }
          }
        }
      }
    }
  }

  const dedupeOfferings = (arr: ParsedOffering[]) => {
    const seen = new Set<string>();
    return arr.filter((item) => {
      const key = `${item.slot}_${item.faculty.toLowerCase()}_${item.venue.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const cleanTheory = dedupeOfferings(theoryOfferings);
  const cleanLab = dedupeOfferings(labOfferings);

  // 10. Check if at least 1 offering was found
  if (cleanTheory.length === 0 && cleanLab.length === 0) {
    return {
      success: false,
      error: {
        code: 'NO_OFFERINGS_FOUND',
        title: 'No Faculty Slots Found',
        message: `Found course header "${courseCode} - ${courseTitle}", but no theory or lab slots were available in the table.`,
        suggestion: 'Make sure the course table had finished loading in VTOP before you saved the HTML page.',
      },
    };
  }

  return {
    success: true,
    data: {
      courseCode,
      courseTitle: courseTitle || courseCode,
      courseType:
        courseType || (cleanLab.length > 0 && cleanTheory.length > 0 ? 'Embedded Theory and Lab' : 'Theory Only'),
      credits,
      semesterMismatch,
      semesterNote,
      theoryOfferings: cleanTheory,
      labOfferings: cleanLab,
    },
  };
}

/**
 * Standard parser (returns ParsedMockCourse or null)
 */
export function parseMockHtml(htmlContent: string): ParsedMockCourse | null {
  const result = parseMockHtmlDetailed(htmlContent);
  return result.success && result.data ? result.data : null;
}
