import fs from 'fs';
import path from 'path';
import { parseMockHtmlDetailed } from '../lib/mock-html-parser';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

interface OfferingItem {
  slot: string;
  faculty: string;
  venue: string;
  isLab: boolean;
}

const mockFiles = [
  // 5 courses explicitly requested by user
  'mock_html/cse2007.html', // CSE2007: DBMS (ETH, 4 credits)
  'mock_html/cse1005.html', // CSE1005: Software Engineering (TH, 4 credits)
  'mock_html/sts2011.html', // STS2011: Quantitative & Qualitative Skills Practice II (TH, 1 credit)
  'mock_html/cse2008.html', // CSE2008: Operating Systems (ETH, 4 credits)
  'mock_html/mat1010.html', // MAT1010: Probability & Statistics (ETH, 4 credits)
  
  // Additional uploaded courses
  'mock_html/cse1021.html', // CSE1021: Blockchain Technology (TH, 3 credits)
  'mock_html/mec2005.html', // MEC2005: Manufacturing Processes (ETH, 4 credits)
  'mock_html/mec2018.html', // MEC2018: Thermal Engineering (ETH, 4 credits)
  'mock_html/mec3002.html', // MEC3002: Theory of Machines (ETH, 4 credits)
  'mock_html/cse1006.html', // CSE1006: Data Analytics (ETH, 4 credits)
  'mock_html/cse1007.html', // CSE1007: Cryptography (ETH, 4 credits)
  
  // Previous mock html files from today
  'mock_html/cse1022.html',
  'mock_html/ece1002.html',
  'mock_html/mat1002.html',
  'mock_html/phy1008.html',
  
  // Latest course offerings
  'mock_html/ece2003.html', // ECE2003: Control Systems Engineering (ETH, 4 credits)
  'mock_html/ece2016.html', // ECE2016: Engineering Electromagnetics (TH, 4 credits)
];

async function run() {
  console.log('Loading existing datasets...');
  const coursesPath = path.resolve('lib/courses.json');
  const rawSlotsPath = path.resolve('lib/winter_raw_slots.json');
  const facultiesPath = path.resolve('lib/faculties.json');
  const fallbackPath = path.resolve('lib/fallback_faculties.json');

  let courses: any[] = JSON.parse(fs.readFileSync(coursesPath, 'utf8'));
  let rawSlots: any[] = JSON.parse(fs.readFileSync(rawSlotsPath, 'utf8'));
  let facultiesMap: Record<string, any[]> = fs.existsSync(facultiesPath)
    ? JSON.parse(fs.readFileSync(facultiesPath, 'utf8'))
    : {};
  let fallbackFaculties: Record<string, any> = fs.existsSync(fallbackPath)
    ? JSON.parse(fs.readFileSync(fallbackPath, 'utf8'))
    : {};

  let totalParsedOfferings = 0;
  let totalRawSlotsUpdated = 0;
  let totalRawSlotsAdded = 0;

  for (const fileRel of mockFiles) {
    const fullPath = path.resolve(fileRel);
    if (!fs.existsSync(fullPath)) {
      console.warn(`File not found: ${fileRel}, skipping.`);
      continue;
    }

    const html = fs.readFileSync(fullPath, 'utf8');
    const result = parseMockHtmlDetailed(html);
    if (!result.success || !result.data) {
      console.error(`Failed to parse ${fileRel}:`, result.error?.message);
      continue;
    }

    const data = result.data;
    const { courseCode, courseTitle, theoryOfferings, labOfferings } = data;
    const allOfferings: OfferingItem[] = [
      ...theoryOfferings.map(o => ({ ...o, isLab: false })),
      ...labOfferings.map(o => ({ ...o, isLab: true })),
    ];

    console.log(`\n--------------------------------------------------`);
    console.log(`Course: ${courseCode} - ${courseTitle}`);
    console.log(`Theory: ${theoryOfferings.length}, Lab: ${labOfferings.length}`);
    totalParsedOfferings += allOfferings.length;

    // 1. Update courses.json
    let courseObj = courses.find(c => c.code === courseCode);
    if (!courseObj) {
      courseObj = {
        id: courseCode,
        code: courseCode,
        name: courseTitle,
        type: labOfferings.length > 0 && theoryOfferings.length > 0 ? 'ETH' : labOfferings.length > 0 ? 'LO' : 'TH',
        credits: courseCode.startsWith('STS') ? 1 : (courseCode === 'CSE1005' ? 4 : (data.credits || 4)),
        theorySlots: [],
        labSlots: [],
      };
      courses.push(courseObj);
    } else {
      if (!courseObj.name || courseObj.name === courseCode) {
        courseObj.name = courseTitle;
      }
      // Ensure strict credit rules
      if (courseCode.startsWith('STS')) {
        courseObj.credits = 1;
      } else if (courseCode === 'CSE1005') {
        courseObj.credits = 4;
      }
    }

    // Add unique slots to courses.json
    for (const t of theoryOfferings) {
      if (!courseObj.theorySlots.includes(t.slot)) {
        courseObj.theorySlots.push(t.slot);
      }
    }
    for (const l of labOfferings) {
      if (!courseObj.labSlots.includes(l.slot)) {
        courseObj.labSlots.push(l.slot);
      }
    }

    // 2. Update faculties.json, fallback_faculties.json, and winter_raw_slots.json
    for (const item of allOfferings) {
      const { slot, faculty, venue, isLab } = item;

      // Update faculties.json
      const facKey = `${courseCode}_${slot}`;
      if (!facultiesMap[facKey]) {
        facultiesMap[facKey] = [];
      }
      const facExists = facultiesMap[facKey].some(
        f => f.faculty.toLowerCase() === faculty.toLowerCase() && f.venue.toLowerCase() === venue.toLowerCase()
      );
      if (!facExists) {
        facultiesMap[facKey].push({ faculty, venue });
      }

      // Update fallback_faculties.json
      const cleanFac = faculty.replace(/[^a-zA-Z0-9]/g, '_');
      const docId = `${courseCode}_${slot}_${cleanFac}`;
      fallbackFaculties[docId] = {
        id: docId,
        courseId: courseCode,
        courseCode: courseCode,
        courseName: courseObj.name || courseTitle,
        slot,
        faculty,
        facultyName: faculty,
        venue,
        status: 'approved',
      };

      // Update winter_raw_slots.json
      const emptySlotIdx = rawSlots.findIndex(
        s => s.courseCode === courseCode && s.slot === slot && (!s.faculty || s.faculty.trim() === '')
      );

      if (emptySlotIdx !== -1) {
        rawSlots[emptySlotIdx].faculty = faculty;
        rawSlots[emptySlotIdx].venue = venue;
        totalRawSlotsUpdated++;
      } else {
        const alreadyExists = rawSlots.some(
          s => s.courseCode === courseCode && s.slot === slot && s.faculty === faculty && s.venue === venue
        );
        if (!alreadyExists) {
          rawSlots.push({
            courseCode,
            courseTitle: courseObj.name || courseTitle,
            courseType: isLab ? 'ELA' : (courseObj.type === 'TH' ? 'TH' : 'ETH'),
            slot,
            faculty,
            venue,
          });
          totalRawSlotsAdded++;
        }
      }
    }
  }

  // Ensure credit invariants across all courses
  for (const c of courses) {
    if (c.code.startsWith('STS')) {
      c.credits = 1;
    } else if (c.code === 'CSE1005') {
      c.credits = 4;
    } else if (c.code === 'ECE2016') {
      c.credits = 4;
    } else if (c.code === 'ECE2003') {
      c.credits = 4;
    } else if (c.code === 'ECE2006') {
      c.credits = 4;
    }
  }

  console.log(`\n==================================================`);
  console.log(`Summary of Ingestion:`);
  console.log(`Total Offerings Processed: ${totalParsedOfferings}`);
  console.log(`Existing empty slots filled in raw_slots: ${totalRawSlotsUpdated}`);
  console.log(`New section offerings added to raw_slots: ${totalRawSlotsAdded}`);
  console.log(`Total winter_raw_slots: ${rawSlots.length}`);
  console.log(`Total courses in courses.json: ${courses.length}`);
  console.log(`Total slot keys in faculties.json: ${Object.keys(facultiesMap).length}`);
  console.log(`Total entries in fallback_faculties.json: ${Object.keys(fallbackFaculties).length}`);

  // Write out files
  fs.writeFileSync(coursesPath, JSON.stringify(courses, null, 2) + '\n', 'utf8');
  fs.writeFileSync(rawSlotsPath, JSON.stringify(rawSlots, null, 2) + '\n', 'utf8');
  fs.writeFileSync(facultiesPath, JSON.stringify(facultiesMap, null, 2) + '\n', 'utf8');
  fs.writeFileSync(fallbackPath, JSON.stringify(fallbackFaculties, null, 2) + '\n', 'utf8');

  console.log(`All files successfully updated!`);

  // Push to Firebase Firestore approved_faculties_bundle
  if (process.env.FIREBASE_PRIVATE_KEY && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
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
}

run().catch(console.error);
