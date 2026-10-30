import fs from 'fs';
import path from 'path';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

interface Offering {
  slot: string;
  venue: string;
  faculty: string;
  isLab: boolean;
}

const offerings: Offering[] = [
  // Theory Slots
  { slot: 'B2+TB2', venue: 'CB-G16', faculty: 'Hanumantharao Bitra', isLab: false },
  { slot: 'B2+TB2', venue: 'CB-G17', faculty: 'Suseela Vappangi', isLab: false },
  { slot: 'B1+TB1', venue: 'CB-111', faculty: 'Kalapraveen Bagadi', isLab: false },
  { slot: 'B1+TB1', venue: 'CB-110', faculty: 'Hanumantharao Bitra', isLab: false },
  { slot: 'C1+TC1', venue: 'CB-230', faculty: 'Suseela Vappangi', isLab: false },

  // Lab Slots
  { slot: 'L31+L32', venue: 'AB2-211', faculty: 'Hanumantharao Bitra', isLab: true },
  { slot: 'L9+L10', venue: 'AB2-211', faculty: 'Kalapraveen Bagadi', isLab: true },
  { slot: 'L23+L24', venue: 'AB2-211', faculty: 'Hanumantharao Bitra', isLab: true },
  { slot: 'L21+L22', venue: 'AB2-211', faculty: 'Khairnar Vikas Vishnu', isLab: true },
  { slot: 'L53+L54', venue: 'AB2-211', faculty: 'Khairnar Vikas Vishnu', isLab: true },
  { slot: 'L43+L44', venue: 'AB2-211', faculty: 'Hanumantharao Bitra', isLab: true },
];

const courseCode = 'ECE2006';
const courseName = 'Communication Systems';

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
    const { slot, faculty, venue } = item;

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
          courseType: item.isLab ? 'ELA' : 'ETH',
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
