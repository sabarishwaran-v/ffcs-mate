import fs from 'fs';
import path from 'path';
import { getAdminDb } from '../lib/firebase-admin';

// Run this script using: 
// npx tsx scripts/import-faculties.ts

interface SubmissionEntry {
  courseCode: string;
  slot: string;
  facultyName: string;
  venue: string;
}

interface FacultyOutput {
  faculty: string;
  venue?: string;
}

const main = async () => {
  console.log("Connecting to Firestore to fetch submissions...");
  const db = getAdminDb();
  
  // Fetch pending submissions
  const snapshot = await db.collection("faculty_submissions").where("status", "==", "pending").get();
  console.log(`Found ${snapshot.size} pending submission documents.`);
  
  const facultyMap: Record<string, FacultyOutput[]> = {};

  snapshot.docs.forEach(doc => {
    const data = doc.data();
    if (data.entries && Array.isArray(data.entries)) {
      data.entries.forEach((entry: SubmissionEntry) => {
        if (!entry.courseCode || !entry.slot || !entry.facultyName) return;
        
        const key = `${entry.courseCode.toUpperCase()}_${entry.slot.toUpperCase()}`;
        if (!facultyMap[key]) {
          facultyMap[key] = [];
        }
        
        // Prevent exact duplicates
        const exists = facultyMap[key].find(f => f.faculty.toLowerCase() === entry.facultyName.toLowerCase());
        if (!exists) {
          facultyMap[key].push({
            faculty: entry.facultyName,
            ...(entry.venue ? { venue: entry.venue } : {})
          });
        }
      });
    }
  });

  // Also read existing faculties.json so we don't overwrite verified data
  const outputPath = path.resolve(__dirname, '../lib/faculties.json');
  let existingData: Record<string, FacultyOutput[]> = {};
  if (fs.existsSync(outputPath)) {
    try {
      existingData = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
    } catch (e) {
      console.warn("Could not read existing faculties.json, starting fresh.");
    }
  }

  // Merge the new data with the old data
  for (const [key, faculties] of Object.entries(facultyMap)) {
    if (!existingData[key]) {
      existingData[key] = [];
    }
    for (const fac of faculties) {
      const exists = existingData[key].find(f => f.faculty.toLowerCase() === fac.faculty.toLowerCase());
      if (!exists) {
        existingData[key].push(fac);
      }
    }
  }

  fs.writeFileSync(outputPath, JSON.stringify(existingData, null, 2), 'utf-8');
  console.log(`Successfully merged and saved faculties data to lib/faculties.json.`);
  
  // Optionally mark them as processed in DB (uncomment to enable)
  /*
  const batch = db.batch();
  snapshot.docs.forEach(doc => {
    batch.update(doc.ref, { status: "processed" });
  });
  await batch.commit();
  console.log("Marked all fetched submissions as processed in Firestore.");
  */
};

main().catch(console.error);
