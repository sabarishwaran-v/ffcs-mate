import fs from 'fs';
import path from 'path';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

interface Offering {
  courseCode: string;
  courseName: string;
  slot: string;
  venue: string;
  faculty: string;
  isLab: boolean;
}

const offerings: Offering[] = [
  // 1. CSE3001 - Agile Development Process (Embedded Theory & Project, 4 credits)
  { courseCode: 'CSE3001', courseName: 'Agile Development Process', slot: 'A2+TA2', venue: 'CB-326', faculty: 'Khasim Syed', isLab: false },
  { courseCode: 'CSE3001', courseName: 'Agile Development Process', slot: 'A2+TA2', venue: 'CB-327', faculty: 'Annapureddy V N Reddy', isLab: false },
  { courseCode: 'CSE3001', courseName: 'Agile Development Process', slot: 'D1+TDD1', venue: 'CB-501', faculty: 'Annapureddy V N Reddy', isLab: false },
  { courseCode: 'CSE3001', courseName: 'Agile Development Process', slot: 'D2+TD2', venue: 'CB-432', faculty: 'KANHAIYA SHARMA', isLab: false },
  { courseCode: 'CSE3001', courseName: 'Agile Development Process', slot: 'D2+TDD2', venue: 'CB-G14', faculty: 'Khasim Syed', isLab: false },
  { courseCode: 'CSE3001', courseName: 'Agile Development Process', slot: 'A1+TA1', venue: 'CB-523', faculty: 'Khasim Syed', isLab: false },
  { courseCode: 'CSE3001', courseName: 'Agile Development Process', slot: 'A1+TA1', venue: 'CB-524', faculty: 'KANHAIYA SHARMA', isLab: false },
  { courseCode: 'CSE3001', courseName: 'Agile Development Process', slot: 'D1+TD1', venue: 'CB-433', faculty: 'Guruprakash Jayabalasamy', isLab: false },
  { courseCode: 'CSE3001', courseName: 'Agile Development Process', slot: 'D2+TD2', venue: 'CB-433', faculty: 'Bommaredy Lokesh', isLab: false },

  // 2. CSE3002 - Artificial Intelligence (Embedded Theory & Lab, 4 credits)
  // Theory
  { courseCode: 'CSE3002', courseName: 'Artificial Intelligence', slot: 'A1+TA1', venue: 'CB-526', faculty: 'VISWANATHAN', isLab: false },
  { courseCode: 'CSE3002', courseName: 'Artificial Intelligence', slot: 'A2+TA2', venue: 'CB-408', faculty: 'Balusa Bhanu Chander', isLab: false },
  { courseCode: 'CSE3002', courseName: 'Artificial Intelligence', slot: 'A2+TA2', venue: 'CB-415', faculty: 'Eswaraiah Rayachoti', isLab: false },
  { courseCode: 'CSE3002', courseName: 'Artificial Intelligence', slot: 'D1+TDD1', venue: 'CB-505', faculty: 'VISWANATHAN', isLab: false },
  { courseCode: 'CSE3002', courseName: 'Artificial Intelligence', slot: 'D2+TD2', venue: 'CB-501', faculty: 'Balusa Bhanu Chander', isLab: false },
  { courseCode: 'CSE3002', courseName: 'Artificial Intelligence', slot: 'D2+TDD2', venue: 'CB-114', faculty: 'Eswaraiah Rayachoti', isLab: false },
  { courseCode: 'CSE3002', courseName: 'Artificial Intelligence', slot: 'A1+TA1', venue: 'CB-525', faculty: 'Eswaraiah Rayachoti', isLab: false },
  { courseCode: 'CSE3002', courseName: 'Artificial Intelligence', slot: 'A2+TA2', venue: 'CB-407', faculty: 'VISWANATHAN', isLab: false },
  { courseCode: 'CSE3002', courseName: 'Artificial Intelligence', slot: 'D1+TD1', venue: 'CB-504', faculty: 'Balusa Bhanu Chander', isLab: false },
  // Lab
  { courseCode: 'CSE3002', courseName: 'Artificial Intelligence', slot: 'L11+L12', venue: 'CB-302', faculty: 'VISWANATHAN', isLab: true },
  { courseCode: 'CSE3002', courseName: 'Artificial Intelligence', slot: 'L23+L24', venue: 'CB-409', faculty: 'Eswaraiah Rayachoti', isLab: true },
  { courseCode: 'CSE3002', courseName: 'Artificial Intelligence', slot: 'L25+L26', venue: 'CB-417', faculty: 'Balusa Bhanu Chander', isLab: true },
  { courseCode: 'CSE3002', courseName: 'Artificial Intelligence', slot: 'L43+L44', venue: 'CB-102', faculty: 'VISWANATHAN', isLab: true },
  { courseCode: 'CSE3002', courseName: 'Artificial Intelligence', slot: 'L9+L10', venue: 'CB-417', faculty: 'Balusa Bhanu Chander', isLab: true },
  { courseCode: 'CSE3002', courseName: 'Artificial Intelligence', slot: 'L3+L4', venue: 'CB-122', faculty: 'Balusa Bhanu Chander', isLab: true },
  { courseCode: 'CSE3002', courseName: 'Artificial Intelligence', slot: 'L49+L50', venue: 'CB-121', faculty: 'Eswaraiah Rayachoti', isLab: true },
  { courseCode: 'CSE3002', courseName: 'Artificial Intelligence', slot: 'L41+L42', venue: 'CB-121', faculty: 'Eswaraiah Rayachoti', isLab: true },
  { courseCode: 'CSE3002', courseName: 'Artificial Intelligence', slot: 'L39+L40', venue: 'CB-202', faculty: 'VISWANATHAN', isLab: true },

  // 3. ECE2015 - Computer Architecture (Theory Only, 4 credits)
  { courseCode: 'ECE2015', courseName: 'Computer Architecture', slot: 'F2+TBB1+TF2', venue: 'CB-216', faculty: 'Ashish Gupta', isLab: false },
  { courseCode: 'ECE2015', courseName: 'Computer Architecture', slot: 'F2+TBB1+TF2', venue: 'CB-217', faculty: 'Agam Das Goswami', isLab: false },
  { courseCode: 'ECE2015', courseName: 'Computer Architecture', slot: 'F2+TBB1+TF2', venue: 'CB-218', faculty: 'Jayendra Kumar', isLab: false },
  { courseCode: 'ECE2015', courseName: 'Computer Architecture', slot: 'F1+TBB2+TF1', venue: 'CB-120', faculty: 'Ashish Gupta', isLab: false },
  { courseCode: 'ECE2015', courseName: 'Computer Architecture', slot: 'F1+TBB2+TF1', venue: 'CB-119', faculty: 'Jayendra Kumar', isLab: false },

  // 4. SWE2006 - Database Systems (Embedded Theory & Lab, 4 credits)
  // Theory
  { courseCode: 'SWE2006', courseName: 'Database Systems', slot: 'C2+TC2', venue: 'CB-516', faculty: 'Sandipan Maiti', isLab: false },
  { courseCode: 'SWE2006', courseName: 'Database Systems', slot: 'C2+TC2', venue: 'CB-518', faculty: 'KANHAIYA SHARMA', isLab: false },
  { courseCode: 'SWE2006', courseName: 'Database Systems', slot: 'B2+TB2', venue: 'CB-431', faculty: 'Hari Seetha', isLab: false },
  { courseCode: 'SWE2006', courseName: 'Database Systems', slot: 'B1+TB1', venue: 'CB-521', faculty: 'Hari Seetha', isLab: false },
  { courseCode: 'SWE2006', courseName: 'Database Systems', slot: 'B2+TB2', venue: 'CB-432', faculty: 'Monalisa Sahu', isLab: false },
  { courseCode: 'SWE2006', courseName: 'Database Systems', slot: 'C1+TCC1', venue: 'CB-112', faculty: 'Monalisa Sahu', isLab: false },
  { courseCode: 'SWE2006', courseName: 'Database Systems', slot: 'B1+TB1', venue: 'CB-520', faculty: 'Nagaraju Devarakonda', isLab: false },
  { courseCode: 'SWE2006', courseName: 'Database Systems', slot: 'C2+TCC2', venue: 'CB-112', faculty: 'Nagaraju Devarakonda', isLab: false },
  { courseCode: 'SWE2006', courseName: 'Database Systems', slot: 'C1+TC1', venue: 'CB-521', faculty: 'PUTTA DURGA', isLab: false },
  // Lab
  { courseCode: 'SWE2006', courseName: 'Database Systems', slot: 'L9+L10', venue: 'CB-416', faculty: 'Hari Seetha', isLab: true },
  { courseCode: 'SWE2006', courseName: 'Database Systems', slot: 'L5+L6', venue: 'CB-209', faculty: 'Hari Seetha', isLab: true },
  { courseCode: 'SWE2006', courseName: 'Database Systems', slot: 'L51+L52', venue: 'CB-416', faculty: 'Nagaraju Devarakonda', isLab: true },
  { courseCode: 'SWE2006', courseName: 'Database Systems', slot: 'L31+L32', venue: 'ONL01002', faculty: 'Sandipan Maiti', isLab: true },
  { courseCode: 'SWE2006', courseName: 'Database Systems', slot: 'L47+L48', venue: 'CB-409', faculty: 'KANHAIYA SHARMA', isLab: true },
  { courseCode: 'SWE2006', courseName: 'Database Systems', slot: 'L29+L30', venue: 'CB-102', faculty: 'Monalisa Sahu', isLab: true },
  { courseCode: 'SWE2006', courseName: 'Database Systems', slot: 'L33+L34', venue: 'CB-301', faculty: 'Nagaraju Devarakonda', isLab: true },
  { courseCode: 'SWE2006', courseName: 'Database Systems', slot: 'L31+L32', venue: 'CB-209', faculty: 'Monalisa Sahu', isLab: true },
  { courseCode: 'SWE2006', courseName: 'Database Systems', slot: 'L15+L16', venue: 'CB-303', faculty: 'PUTTA DURGA', isLab: true },

  // 5. SWE3001 - Fundamentals of Computer Networks (Embedded Theory & Lab, 4 credits)
  // Theory
  { courseCode: 'SWE3001', courseName: 'Fundamentals of Computer Networks', slot: 'B2+TB2', venue: 'CB-501', faculty: 'DHARANI SABARI SAMUDRALA', isLab: false },
  { courseCode: 'SWE3001', courseName: 'Fundamentals of Computer Networks', slot: 'B2+TB2', venue: 'CB-433', faculty: 'KARNAM BALAJI', isLab: false },
  { courseCode: 'SWE3001', courseName: 'Fundamentals of Computer Networks', slot: 'C2+TC2', venue: 'CB-519', faculty: 'KARNAM BALAJI', isLab: false },
  { courseCode: 'SWE3001', courseName: 'Fundamentals of Computer Networks', slot: 'C2+TCC2', venue: 'CB-113', faculty: 'PARITALA JHANSIRANI', isLab: false },
  { courseCode: 'SWE3001', courseName: 'Fundamentals of Computer Networks', slot: 'C1+TCC1', venue: 'CB-107', faculty: 'Shaik Subhani', isLab: false },
  { courseCode: 'SWE3001', courseName: 'Fundamentals of Computer Networks', slot: 'B2+TB2', venue: 'CB-504', faculty: 'PARITALA JHANSIRANI', isLab: false },
  { courseCode: 'SWE3001', courseName: 'Fundamentals of Computer Networks', slot: 'C1+TC1', venue: 'CB-523', faculty: 'Reeja S R', isLab: false },
  { courseCode: 'SWE3001', courseName: 'Fundamentals of Computer Networks', slot: 'B1+TB1', venue: 'CB-523', faculty: 'Reeja S R', isLab: false },
  { courseCode: 'SWE3001', courseName: 'Fundamentals of Computer Networks', slot: 'B1+TB1', venue: 'CB-524', faculty: 'KARNAM BALAJI', isLab: false },
  // Lab
  { courseCode: 'SWE3001', courseName: 'Fundamentals of Computer Networks', slot: 'L15+L16', venue: 'CB-307', faculty: 'Reeja S R', isLab: true },
  { courseCode: 'SWE3001', courseName: 'Fundamentals of Computer Networks', slot: 'L27+L28', venue: 'CB-419', faculty: 'KARNAM BALAJI', isLab: true },
  { courseCode: 'SWE3001', courseName: 'Fundamentals of Computer Networks', slot: 'L7+L8', venue: 'CB-121', faculty: 'KARNAM BALAJI', isLab: true },
  { courseCode: 'SWE3001', courseName: 'Fundamentals of Computer Networks', slot: 'L23+L24', venue: 'CB-228', faculty: 'PARITALA JHANSIRANI', isLab: true },
  { courseCode: 'SWE3001', courseName: 'Fundamentals of Computer Networks', slot: 'L43+L44', venue: 'CB-101', faculty: 'DHARANI SABARI SAMUDRALA', isLab: true },
  { courseCode: 'SWE3001', courseName: 'Fundamentals of Computer Networks', slot: 'L21+L22', venue: 'CB-106', faculty: 'Shaik Subhani', isLab: true },
  { courseCode: 'SWE3001', courseName: 'Fundamentals of Computer Networks', slot: 'L37+L38', venue: 'CB-307', faculty: 'PARITALA JHANSIRANI', isLab: true },
  { courseCode: 'SWE3001', courseName: 'Fundamentals of Computer Networks', slot: 'L55+L56', venue: 'CB-409', faculty: 'KARNAM BALAJI', isLab: true },
  { courseCode: 'SWE3001', courseName: 'Fundamentals of Computer Networks', slot: 'L45+L46', venue: 'CB-228', faculty: 'Reeja S R', isLab: true },
];

async function run() {
  console.log('Loading datasets...');
  const facultiesPath = path.resolve('lib/faculties.json');
  const fallbackPath = path.resolve('lib/fallback_faculties.json');
  const rawSlotsPath = path.resolve('lib/winter_raw_slots.json');
  const coursesPath = path.resolve('lib/courses.json');

  const facultiesMap: Record<string, any[]> = JSON.parse(fs.readFileSync(facultiesPath, 'utf8'));
  const fallbackFaculties: Record<string, any> = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'));
  const rawSlots: any[] = JSON.parse(fs.readFileSync(rawSlotsPath, 'utf8'));
  const courses: any[] = JSON.parse(fs.readFileSync(coursesPath, 'utf8'));

  // 1. Update courses.json
  const ece2015 = courses.find((c: any) => c.code === 'ECE2015');
  if (ece2015) {
    ece2015.credits = 4;
    console.log('Updated ECE2015 credits to 4');
  }

  let filledRawSlots = 0;

  for (const item of offerings) {
    const { courseCode, courseName, slot, faculty, venue, isLab } = item;

    // Ensure courses.json slots include this slot
    const courseObj = courses.find((c: any) => c.code === courseCode);
    if (courseObj) {
      if (isLab) {
        if (!courseObj.labSlots.includes(slot)) {
          courseObj.labSlots.push(slot);
        }
      } else {
        if (!courseObj.theorySlots.includes(slot)) {
          courseObj.theorySlots.push(slot);
        }
      }
    }

    // 2. faculties.json
    const facKey = `${courseCode}_${slot}`;
    if (!facultiesMap[facKey]) {
      facultiesMap[facKey] = [];
    }
    const existsInFac = facultiesMap[facKey].some(
      f => f.faculty.toLowerCase() === faculty.toLowerCase() && f.venue.toLowerCase() === venue.toLowerCase()
    );
    if (!existsInFac) {
      facultiesMap[facKey].push({ faculty, venue });
    }

    // 3. fallback_faculties.json
    const cleanFac = faculty.replace(/[^a-zA-Z0-9]/g, '_');
    const docId = `${courseCode}_${slot}_${cleanFac}`;
    fallbackFaculties[docId] = {
      id: docId,
      courseId: courseCode,
      courseCode: courseCode,
      courseName: courseName,
      slot,
      faculty,
      facultyName: faculty,
      venue,
      status: 'approved',
    };

    // 4. winter_raw_slots.json
    const emptySlotIdx = rawSlots.findIndex(
      s => s.courseCode === courseCode && s.slot === slot && (!s.faculty || s.faculty.trim() === '')
    );
    if (emptySlotIdx !== -1) {
      rawSlots[emptySlotIdx].faculty = faculty;
      rawSlots[emptySlotIdx].venue = venue;
      filledRawSlots++;
    } else {
      const alreadyExists = rawSlots.some(
        s => s.courseCode === courseCode && s.slot === slot && s.faculty === faculty && s.venue === venue
      );
      if (!alreadyExists) {
        rawSlots.push({
          courseCode,
          courseTitle: courseName,
          courseType: isLab ? 'ELA' : (courseObj?.type === 'TH' ? 'TH' : 'ETH'),
          slot,
          faculty,
          venue,
        });
      }
    }
  }

  console.log(`\nProcessed ${offerings.length} total offerings.`);
  console.log(`Filled ${filledRawSlots} empty slots in winter_raw_slots.json`);
  console.log(`Total slot keys in faculties.json: ${Object.keys(facultiesMap).length}`);
  console.log(`Total entries in fallback_faculties.json: ${Object.keys(fallbackFaculties).length}`);

  fs.writeFileSync(coursesPath, JSON.stringify(courses, null, 2) + '\n', 'utf8');
  fs.writeFileSync(facultiesPath, JSON.stringify(facultiesMap, null, 2) + '\n', 'utf8');
  fs.writeFileSync(fallbackPath, JSON.stringify(fallbackFaculties, null, 2) + '\n', 'utf8');
  fs.writeFileSync(rawSlotsPath, JSON.stringify(rawSlots, null, 2) + '\n', 'utf8');

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
      const cCode = parts[0];
      const sLot = parts.slice(1).join('_');

      slotArray.forEach((f: any) => {
        const id = `${cCode}_${sLot}_${f.faculty.replace(/[^a-zA-Z0-9]/g, '_')}`;
        bundleData[id] = {
          id: id,
          courseCode: cCode,
          slot: sLot,
          faculty: f.faculty,
          venue: f.venue || 'Unknown',
          approvedAt: new Date().toISOString(),
          approvedBy: 'Verified Screenshot Ingestion'
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
