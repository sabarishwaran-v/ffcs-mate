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

async function migrate() {
  console.log('Starting migration to bundle...');
  try {
    const snapshot = await db.collection('approved_faculties').get();
    
    if (snapshot.empty) {
      console.log('No approved faculties found to migrate.');
      process.exit(0);
    }
    
    const bundleData = {};
    let count = 0;
    
    snapshot.forEach(doc => {
      bundleData[doc.id] = doc.data();
      count++;
    });
    
    console.log(`Bundling ${count} faculties...`);
    
    await db.collection('system').doc('approved_faculties_bundle').set(bundleData, { merge: true });
    
    console.log('Successfully created the bundle document!');
    
    // Optional: Delete old collection (leaving it for safety for now)
    // console.log('Cleaning up old collection...');
    // const batch = db.batch();
    // snapshot.docs.forEach((doc) => {
    //   batch.delete(doc.ref);
    // });
    // await batch.commit();
    // console.log('Deleted old collection.');
    
    console.log('Migration complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
}

migrate();
