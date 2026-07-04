const fs = require("fs");
const env = fs.readFileSync(".env.local", "utf8").split("\n").reduce((acc, line) => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) acc[match[1]] = match[2].replace(/^"|"$/g, "").replace(/\\n/g, "\n");
  return acc;
}, {});

const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

initializeApp({
  credential: cert({
    projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: env.FIREBASE_CLIENT_EMAIL,
    privateKey: env.FIREBASE_PRIVATE_KEY
  })
});

const db = getFirestore();

(async () => {
  console.log("Fetching pending faculties...");
  const pendingSnapshot = await db.collection("pending_faculties").get();
  
  const batch = db.batch();
  let count = 0;
  
  pendingSnapshot.forEach(doc => {
    const data = doc.data();
    data.status = "approved"; // Mark as approved
    
    // Set in approved_faculties
    const approvedRef = db.collection("approved_faculties").doc(doc.id);
    batch.set(approvedRef, data);
    
    // Delete from pending_faculties
    const pendingRef = db.collection("pending_faculties").doc(doc.id);
    batch.delete(pendingRef);
    
    count++;
  });
  
  if (count > 0) {
    console.log(`Committing batch migration of ${count} faculties...`);
    await batch.commit();
    console.log(`Successfully migrated ${count} faculties to approved_faculties!`);
  } else {
    console.log("No pending faculties found.");
  }
  
  process.exit(0);
})();
