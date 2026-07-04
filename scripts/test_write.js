const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
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

async function testWrite() {
  try {
    await db.collection('system').doc('test_write').set({ test: true });
    console.log('Write successful!');
    process.exit(0);
  } catch (error) {
    console.error('Write failed:', error);
    process.exit(1);
  }
}

testWrite();
