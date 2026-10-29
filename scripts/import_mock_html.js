const fs = require('fs');
const path = require('path');

/**
 * Universal Mock FFCS HTML Parser & Ingester
 * Usage: node scripts/import_mock_html.js <path_to_html_file_or_directory>
 */

function parseMockHtmlFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  // Strip HTML comments to avoid false-matching commented-out table cells
  content = content.replace(/<!--[\s\S]*?-->/g, '');

  // 1. Extract Course Code
  let courseCode = null;
  const hiddenCodeMatch = content.match(/id=["']courseCodehid["'][^>]*value=["']([A-Z0-9]+)["']/i) ||
                          content.match(/value=["']([A-Z0-9]+)["'][^>]*id=["']courseCodehid["']/i);
  if (hiddenCodeMatch) {
    courseCode = hiddenCodeMatch[1].trim();
  }

  // 2. Extract Course Detail & Title
  // Header: <span>ENG2001 - English for Professional Communication - Embedded Theory and Lab</span>
  let courseTitle = '';
  let eligibleType = '';
  const detailHeaderMatch = content.match(/COURSE\s+DETAIL[\s\S]*?<span>([A-Z]{3,4}\d{4})\s*-\s*([^<]+?)(?:\s*-\s*([^<]+))?<\/span>/i);
  
  if (detailHeaderMatch) {
    if (!courseCode) courseCode = detailHeaderMatch[1].trim();
    courseTitle = detailHeaderMatch[2].trim();
    eligibleType = detailHeaderMatch[3] ? detailHeaderMatch[3].trim() : '';
  } else {
    // Fallback search for course line
    const fallbackMatch = content.match(/<span>([A-Z]{3,4}\d{4})\s*-\s*([^<]+?)(?:\s*-\s*([^<]+))?<\/span>/i);
    if (fallbackMatch && !fallbackMatch[1].startsWith('26BCE')) {
      if (!courseCode) courseCode = fallbackMatch[1].trim();
      courseTitle = fallbackMatch[2].trim();
      eligibleType = fallbackMatch[3] ? fallbackMatch[3].trim() : '';
    }
  }

  if (!courseCode) {
    console.warn(`[WARN] Could not find course code in ${filePath}`);
    return null;
  }

  // 3. Extract L T P J C
  let credits = 4;
  const ltpjcMatch = content.match(/<span>(\d)\s+(\d)\s+(\d)\s+(\d)\s+(\d+(?:\.\d+)?)<\/span>/i) ||
                     content.match(/(\d)\s+(\d)\s+(\d)\s+(\d)\s+(\d+(?:\.\d+)?)/);
  if (ltpjcMatch) {
    credits = parseFloat(ltpjcMatch[5]) || 4;
  }

  // 4. Extract Theory and Lab sections
  const theoryEntries = [];
  const labEntries = [];

  // Split by component ribbons if available
  const sections = content.split(/<td[^>]*class=["']component-header-ribbon["'][^>]*>/i);

  if (sections.length > 1) {
    for (let i = 1; i < sections.length; i++) {
      const sectionHtml = sections[i];
      const headerMatch = sectionHtml.match(/^\s*(?:<div>)?([^<]+)/i);
      const sectionName = headerMatch ? headerMatch[1].trim().toLowerCase() : '';
      const isLab = sectionName.includes('lab');

      extractRows(sectionHtml, isLab, isLab ? labEntries : theoryEntries);
    }
  } else {
    // If no ribbon split found, check for LAB SLOTS keyword
    const hasLabSection = /LAB\s+SLOTS/i.test(content);
    if (hasLabSection) {
      const parts = content.split(/LAB\s+SLOTS/i);
      extractRows(parts[0], false, theoryEntries);
      extractRows(parts[1], true, labEntries);
    } else {
      extractRows(content, false, theoryEntries);
    }
  }

  function extractRows(htmlSection, isLab, targetArray) {
    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let match;
    while ((match = rowRegex.exec(htmlSection)) !== null) {
      const rowContent = match[1];
      if (rowContent.includes('<th') || rowContent.includes('component-header-ribbon') || rowContent.includes('COURSE CATEGORY')) {
        continue;
      }

      const cells = [];
      const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
      let cellMatch;
      while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
        cells.push(cellMatch[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim());
      }

      if (cells.length >= 3) {
        const slotCandidate = cells[0];
        const venueCandidate = cells[1];
        const facultyCandidate = cells[2];

        if (slotCandidate && facultyCandidate) {
          const normSlot = slotCandidate.replace(/\s*\+\s*/g, '+').toUpperCase();
          const normVenue = venueCandidate || 'TBA';
          const normFaculty = facultyCandidate.replace(/\s+/g, ' ').trim();

          // Ensure it's not a button or empty label
          if (normSlot && normFaculty && !normFaculty.toLowerCase().includes('select') && !normFaculty.toLowerCase().includes('radio')) {
            targetArray.push({
              slot: normSlot,
              venue: normVenue,
              faculty: normFaculty,
              isLab
            });
          }
        }
      }
    }
  }

  return {
    courseCode,
    courseTitle: courseTitle || courseCode,
    eligibleType,
    credits,
    theoryEntries,
    labEntries
  };
}

function processAndSave(parsedResults) {
  let rawSlots = [];
  try {
    rawSlots = JSON.parse(fs.readFileSync('lib/winter_raw_slots.json', 'utf-8'));
  } catch (e) {
    rawSlots = [];
  }

  let courses = [];
  try {
    courses = JSON.parse(fs.readFileSync('lib/courses.json', 'utf-8'));
  } catch (e) {
    courses = [];
  }

  let fallbackFaculties = {};
  try {
    fallbackFaculties = JSON.parse(fs.readFileSync('lib/fallback_faculties.json', 'utf-8'));
  } catch (e) {
    fallbackFaculties = {};
  }

  let facultiesMap = {};
  try {
    facultiesMap = JSON.parse(fs.readFileSync('lib/faculties.json', 'utf-8'));
  } catch (e) {
    facultiesMap = {};
  }

  for (const res of parsedResults) {
    if (!res) continue;
    const { courseCode, courseTitle, credits, theoryEntries, labEntries } = res;
    console.log(`\n========================================`);
    console.log(`Processing Course: ${courseCode} - ${courseTitle}`);
    console.log(`Found: ${theoryEntries.length} theory rows, ${labEntries.length} lab rows`);

    // Ensure course exists in courses.json
    let courseObj = courses.find(c => c.code === courseCode);
    if (!courseObj) {
      courseObj = {
        id: courseCode,
        code: courseCode,
        name: courseTitle,
        type: labEntries.length > 0 && theoryEntries.length > 0 ? "ETH" : labEntries.length > 0 ? "LO" : "TH",
        credits: credits || 4,
        theorySlots: [],
        labSlots: []
      };
      courses.push(courseObj);
    } else {
      if (!courseObj.name || courseObj.name === courseCode) {
        courseObj.name = courseTitle;
      }
    }

    const allEntries = [...theoryEntries, ...labEntries];
    let matchedCount = 0;
    let addedCount = 0;

    for (const item of allEntries) {
      const { slot, venue, faculty, isLab } = item;

      // 1. Update courseObj slots list
      if (isLab) {
        if (!courseObj.labSlots.includes(slot)) {
          courseObj.labSlots.push(slot);
        }
      } else {
        if (!courseObj.theorySlots.includes(slot)) {
          courseObj.theorySlots.push(slot);
        }
      }

      // 2. Add to fallback_faculties.json
      const cleanFacName = faculty.replace(/[^a-zA-Z0-9]/g, '_');
      const docId = `${courseCode}_${slot}_${cleanFacName}`;
      fallbackFaculties[docId] = {
        id: docId,
        courseId: courseCode,
        courseCode: courseCode,
        courseName: courseTitle,
        slot: slot,
        faculty: faculty,
        facultyName: faculty,
        venue: venue,
        status: "approved"
      };

      // 3. Add to faculties.json (for UI direct load)
      const slotKey = `${courseCode}_${slot}`;
      if (!facultiesMap[slotKey]) {
        facultiesMap[slotKey] = [];
      }
      const alreadyInFacMap = facultiesMap[slotKey].some(
        f => f.faculty.toLowerCase() === faculty.toLowerCase() && f.venue.toLowerCase() === venue.toLowerCase()
      );
      if (!alreadyInFacMap) {
        facultiesMap[slotKey].push({ faculty, venue });
      }

      // 4. Update winter_raw_slots.json
      // Find an unassigned slot in winter_raw_slots with matching slot name
      const emptySlotIndex = rawSlots.findIndex(
        s => s.courseCode === courseCode && s.slot === slot && (!s.faculty || s.faculty === "")
      );

      if (emptySlotIndex !== -1) {
        rawSlots[emptySlotIndex].faculty = faculty;
        rawSlots[emptySlotIndex].venue = venue;
        matchedCount++;
      } else {
        // All placeholder slots for this slot name are filled (or mock has an extra faculty offering)
        // Check if an identical entry already exists to avoid duplication
        const exists = rawSlots.some(
          s => s.courseCode === courseCode && s.slot === slot && s.faculty === faculty && s.venue === venue
        );
        if (!exists) {
          rawSlots.push({
            courseCode,
            courseTitle: courseObj.name || courseTitle,
            courseType: isLab ? "ELA" : "ETH",
            slot,
            faculty,
            venue
          });
          addedCount++;
        }
      }
    }

    console.log(`Matched to existing empty slots: ${matchedCount}`);
    console.log(`Added as new/expanded offerings: ${addedCount}`);
  }

  // Save all files
  fs.writeFileSync('lib/winter_raw_slots.json', JSON.stringify(rawSlots, null, 2) + '\n');
  fs.writeFileSync('lib/courses.json', JSON.stringify(courses, null, 2) + '\n');
  fs.writeFileSync('lib/fallback_faculties.json', JSON.stringify(fallbackFaculties, null, 2) + '\n');
  fs.writeFileSync('lib/faculties.json', JSON.stringify(facultiesMap, null, 2) + '\n');

  console.log(`\n🎉 Ingestion Complete!`);
  console.log(`- winter_raw_slots.json: ${rawSlots.length} entries`);
  console.log(`- courses.json: ${courses.length} courses`);
  console.log(`- fallback_faculties.json: ${Object.keys(fallbackFaculties).length} faculties`);
  console.log(`- faculties.json: ${Object.keys(facultiesMap).length} slot keys`);
}

// CLI execution
const targetPath = process.argv[2];
if (!targetPath) {
  console.log("Usage: node scripts/import_mock_html.js <file_or_directory>");
  process.exit(1);
}

const resolvedPath = path.resolve(targetPath);
const stat = fs.statSync(resolvedPath);
const parsed = [];

if (stat.isDirectory()) {
  const files = fs.readdirSync(resolvedPath).filter(f => f.endsWith('.html') || f.endsWith('.htm'));
  for (const f of files) {
    const p = path.join(resolvedPath, f);
    const r = parseMockHtmlFile(p);
    if (r) parsed.push(r);
  }
} else {
  const r = parseMockHtmlFile(resolvedPath);
  if (r) parsed.push(r);
}

processAndSave(parsed);
