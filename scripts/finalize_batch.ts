import fs from 'fs';
import path from 'path';
import { parseMockHtmlDetailed } from '../lib/mock-html-parser';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const coursesToFinalize = [
  { code: 'ECE1002', file: 'mock_html/ece1002.html' },
  { code: 'MAT1002', file: 'mock_html/mat1002.html' },
  { code: 'PHY1008', file: 'mock_html/phy1008.html' },
];

async function finalizeCourses() {
  console.log('🚀 Starting Finalization for 3 Courses: ECE1002, MAT1002, PHY1008...');

  const rawSlotsPath = path.resolve('lib/winter_raw_slots.json');
  const coursesPath = path.resolve('lib/courses.json');
  const fallbackPath = path.resolve('lib/fallback_faculties.json');
  const facultiesPath = path.resolve('lib/faculties.json');

  let rawSlots = JSON.parse(fs.readFileSync(rawSlotsPath, 'utf-8'));
  let courses = JSON.parse(fs.readFileSync(coursesPath, 'utf-8'));
  let fallbackFaculties = JSON.parse(fs.readFileSync(fallbackPath, 'utf-8'));
  let facultiesMap = JSON.parse(fs.readFileSync(facultiesPath, 'utf-8'));

  for (const { code, file } of coursesToFinalize) {
    const htmlContent = fs.readFileSync(path.resolve(file), 'utf-8');
    const parseRes = parseMockHtmlDetailed(htmlContent);

    if (!parseRes.success || !parseRes.data) {
      throw new Error(`Failed to parse ${code} from ${file}: ${JSON.stringify(parseRes.error)}`);
    }

    const { courseCode, courseTitle, theoryOfferings, labOfferings, credits } = parseRes.data;
    console.log(`\n========================================`);
    console.log(`Finalizing: ${courseCode} - ${courseTitle}`);
    console.log(`Parsed Theory: ${theoryOfferings.length}, Parsed Lab: ${labOfferings.length}`);

    // 1. Update courses.json
    let courseObj = courses.find((c: any) => c.code === courseCode);
    const isEth = labOfferings.length > 0 && theoryOfferings.length > 0;
    const courseType = isEth ? 'ETH' : labOfferings.length > 0 ? 'LO' : 'TH';

    if (!courseObj) {
      courseObj = {
        id: courseCode,
        code: courseCode,
        name: courseTitle,
        type: courseType,
        credits: credits || 4,
        theorySlots: [],
        labSlots: []
      };
      courses.push(courseObj);
    } else {
      courseObj.name = courseTitle;
      courseObj.type = courseType;
      if (credits) courseObj.credits = credits;
      if (!courseObj.theorySlots) courseObj.theorySlots = [];
      if (!courseObj.labSlots) courseObj.labSlots = [];
    }

    const allOfferings = [
      ...theoryOfferings.map(o => ({ ...o, isLab: false })),
      ...labOfferings.map(o => ({ ...o, isLab: true }))
    ];

    let filledCount = 0;
    let appendedCount = 0;

    for (const item of allOfferings) {
      const { slot, venue, faculty, isLab } = item;

      // Update slots list in courseObj
      if (isLab) {
        if (!courseObj.labSlots.includes(slot)) {
          courseObj.labSlots.push(slot);
        }
      } else {
        if (!courseObj.theorySlots.includes(slot)) {
          courseObj.theorySlots.push(slot);
        }
      }

      // Update fallback_faculties.json
      const cleanFac = faculty.replace(/[^a-zA-Z0-9]/g, '_');
      const docId = `${courseCode}_${slot}_${cleanFac}`;
      fallbackFaculties[docId] = {
        id: docId,
        courseId: courseCode,
        courseCode: courseCode,
        courseName: courseTitle,
        slot: slot,
        faculty: faculty,
        facultyName: faculty,
        venue: venue,
        status: 'approved'
      };

      // Update faculties.json
      const slotKey = `${courseCode}_${slot}`;
      if (!facultiesMap[slotKey]) {
        facultiesMap[slotKey] = [];
      }
      const alreadyExistsInMap = facultiesMap[slotKey].some(
        (f: any) => f.faculty.toLowerCase() === faculty.toLowerCase() && f.venue.toLowerCase() === venue.toLowerCase()
      );
      if (!alreadyExistsInMap) {
        facultiesMap[slotKey].push({ faculty, venue });
      }

      // Update winter_raw_slots.json
      const emptySlotIndex = rawSlots.findIndex(
        (s: any) => s.courseCode === courseCode && s.slot === slot && (!s.faculty || s.faculty === '')
      );

      if (emptySlotIndex !== -1) {
        rawSlots[emptySlotIndex].faculty = faculty;
        rawSlots[emptySlotIndex].venue = venue;
        filledCount++;
      } else {
        const alreadyExistsInRaw = rawSlots.some(
          (s: any) => s.courseCode === courseCode && s.slot === slot && s.faculty === faculty && s.venue === venue
        );
        if (!alreadyExistsInRaw) {
          rawSlots.push({
            courseCode,
            courseTitle: courseObj.name || courseTitle,
            courseType: isLab ? 'ELA' : 'ETH',
            slot,
            faculty,
            venue
          });
          appendedCount++;
        }
      }
    }

    console.log(`✅ ${courseCode}: Filled ${filledCount} empty slots, Appended ${appendedCount} new offerings.`);
  }

  // Write back to files
  fs.writeFileSync(rawSlotsPath, JSON.stringify(rawSlots, null, 2) + '\n');
  fs.writeFileSync(coursesPath, JSON.stringify(courses, null, 2) + '\n');
  fs.writeFileSync(fallbackPath, JSON.stringify(fallbackFaculties, null, 2) + '\n');
  fs.writeFileSync(facultiesPath, JSON.stringify(facultiesMap, null, 2) + '\n');

  console.log('\n💾 All local JSON files successfully written!');
  console.log(`- winter_raw_slots.json entries: ${rawSlots.length}`);
  console.log(`- courses.json total courses: ${courses.length}`);
  console.log(`- fallback_faculties.json entries: ${Object.keys(fallbackFaculties).length}`);
  console.log(`- faculties.json slot keys: ${Object.keys(facultiesMap).length}`);

  // Push to Firebase Firestore approved_faculties_bundle
  console.log('\n☁️ Pushing updated faculties to Firebase Firestore approved_faculties_bundle...');
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      })
    });
  }

  const db = getFirestore();
  const bundleData: Record<string, any> = {};
  let totalFacultiesPushed = 0;

  Object.entries(facultiesMap).forEach(([key, slotArray]: [string, any]) => {
    const parts = key.split('_');
    const courseCode = parts[0];
    const slot = parts.slice(1).join('_');

    slotArray.forEach((f: any) => {
      const id = `${courseCode}_${slot}_${f.faculty.replace(/[^a-zA-Z0-9]/g, '_')}`;
      bundleData[id] = {
        id: id,
        courseCode: courseCode,
        slot: slot,
        faculty: f.faculty,
        venue: f.venue || 'Unknown',
        approvedAt: new Date().toISOString(),
        approvedBy: 'Mock FFCS Ingestion'
      };
      totalFacultiesPushed++;
    });
  });

  console.log(`Pushing ${totalFacultiesPushed} faculties to bundle...`);
  await db.collection('system').doc('approved_faculties_bundle').set(bundleData, { merge: true });
  console.log('🎉 Successfully pushed faculties to approved_faculties_bundle in Firestore!');
}

finalizeCourses()
  .then(() => {
    console.log('✅ Finalization script completed successfully.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Error during finalization:', err);
    process.exit(1);
  });
