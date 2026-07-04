const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

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

async function pushJson() {
  try {
    const filePath = path.join(__dirname, '../lib/faculties.json');
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const faculties = JSON.parse(rawData);

    const bundleData = {};
    let count = 0;

    Object.entries(faculties).forEach(([key, slotArray]) => {
      // key is like "MAT1003_L11+L12"
      const parts = key.split('_');
      const courseCode = parts[0];
      const slot = parts.slice(1).join('_'); // in case there are multiple underscores

      slotArray.forEach((f) => {
        const id = `${courseCode}_${slot}_${f.faculty.replace(/\s+/g, '_')}`;
        bundleData[id] = {
          id: id,
          courseCode: courseCode,
          slot: slot,
          faculty: f.faculty,
          venue: f.venue || "Unknown",
          approvedAt: new Date().toISOString(),
          approvedBy: "System Migration"
        };
        count++;
      });
    });

    console.log(`Pushing ${count} faculties to bundle...`);
    await db.collection('system').doc('approved_faculties_bundle').set(bundleData, { merge: true });
    
    console.log('Successfully pushed faculties.json to bundle!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

pushJson();
