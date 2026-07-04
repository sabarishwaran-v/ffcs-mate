const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) acc[match[1]] = match[2].replace(/^"|"$/g, '').replace(/\\n/g, '\n');
  return acc;
}, {});

const admin = require('firebase-admin');

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY
    })
  });
}

const db = admin.firestore();

async function getCourses() {
  const snapshot = await db.collection('approved_faculties').get();
  const courses = new Set();
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.courseCode) {
      courses.add(`${data.courseCode} - ${data.courseName || data.courseTitle || ''}`);
    }
  });
  console.log(Array.from(courses).join('\n'));
}

getCourses().catch(console.error);
