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
  // ECE3006 - HDL Verification and Methodology
  { courseCode: 'ECE3006', courseName: 'HDL Verification and Methodology', slot: 'F2+TF2', venue: 'CB-219', faculty: 'PILLUTLA SIVA RAMAKRISHNA', isLab: false },
  { courseCode: 'ECE3006', courseName: 'HDL Verification and Methodology', slot: 'F1+TF1', venue: 'CB-225', faculty: 'Aruru Sai Kumar', isLab: false },
  { courseCode: 'ECE3006', courseName: 'HDL Verification and Methodology', slot: 'F2+TF2', venue: 'CB-220', faculty: 'Aruru Sai Kumar', isLab: false },
  { courseCode: 'ECE3006', courseName: 'HDL Verification and Methodology', slot: 'G1+TG1', venue: 'CB-213', faculty: 'PILLUTLA SIVA RAMAKRISHNA', isLab: false },
  { courseCode: 'ECE3006', courseName: 'HDL Verification and Methodology', slot: 'L25+L26', venue: 'AB2-311', faculty: 'Aruru Sai Kumar', isLab: true },
  { courseCode: 'ECE3006', courseName: 'HDL Verification and Methodology', slot: 'L47+L48', venue: 'AB2-311', faculty: 'Aruru Sai Kumar', isLab: true },
  { courseCode: 'ECE3006', courseName: 'HDL Verification and Methodology', slot: 'L33+L34', venue: 'AB2-311', faculty: 'Aruru Sai Kumar', isLab: true },
  { courseCode: 'ECE3006', courseName: 'HDL Verification and Methodology', slot: 'L15+L16', venue: 'AB2-311', faculty: 'Aruru Sai Kumar', isLab: true },

  // ECE2009 - Data Acquisition and Transmission Systems
  { courseCode: 'ECE2009', courseName: 'Data Acquisition and Transmission Systems', slot: 'G2+TG2', venue: 'CB-107', faculty: 'SUNKESULA MOULANA ABDUL KALAM AZAD', isLab: false },
  { courseCode: 'ECE2009', courseName: 'Data Acquisition and Transmission Systems', slot: 'F2+TFF2', venue: 'AB1-G01', faculty: 'SUNKESULA MOULANA ABDUL KALAM AZAD', isLab: false },
  { courseCode: 'ECE2009', courseName: 'Data Acquisition and Transmission Systems', slot: 'F1+TF1', venue: 'CB-115', faculty: 'SUNKESULA MOULANA ABDUL KALAM AZAD', isLab: false },
  { courseCode: 'ECE2009', courseName: 'Data Acquisition and Transmission Systems', slot: 'L13+L14', venue: 'AB2-404', faculty: 'Ashish Gupta', isLab: true },
  { courseCode: 'ECE2009', courseName: 'Data Acquisition and Transmission Systems', slot: 'L3+L4', venue: 'AB2-404', faculty: 'Ashish Gupta', isLab: true },
  { courseCode: 'ECE2009', courseName: 'Data Acquisition and Transmission Systems', slot: 'L49+L50', venue: 'AB2-404', faculty: 'SUNKESULA MOULANA ABDUL KALAM AZAD', isLab: true },
];

async function run() {
  console.log('Loading datasets...');
  const facultiesPath = path.resolve('lib/faculties.json');
  const fallbackPath = path.resolve('lib/fallback_faculties.json');
  const rawSlotsPath = path.resolve('lib/winter_raw_slots.json');

  const facultiesMap: Record<string, any[]> = JSON.parse(fs.readFileSync(facultiesPath, 'utf8'));
  const fallbackFaculties: Record<string, any> = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'));
  const rawSlots: any[] = JSON.parse(fs.readFileSync(rawSlotsPath, 'utf8'));

  let filledRawSlots = 0;

  for (const item of offerings) {
    const { courseCode, courseName, slot, faculty, venue, isLab } = item;

    // 1. faculties.json
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

    // 2. fallback_faculties.json
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

    // 3. winter_raw_slots.json
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
          courseType: isLab ? 'ELA' : 'ETH',
          slot,
          faculty,
          venue,
        });
      }
    }
  }

  console.log(`Filled ${filledRawSlots} empty slots in winter_raw_slots.json`);
  console.log(`Total slot keys in faculties.json: ${Object.keys(facultiesMap).length}`);
  console.log(`Total entries in fallback_faculties.json: ${Object.keys(fallbackFaculties).length}`);

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
