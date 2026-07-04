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
  const snapshot = await db.collection("approved_faculties").where("courseCode", "==", "MAT1003").get();
  console.log("MAT1003 count:", snapshot.size);
  
  const allSnap = await db.collection("approved_faculties").get();
  const codes = new Set();
  allSnap.forEach(doc => codes.add(doc.data().courseCode));
  console.log("All course codes in approved_faculties:", Array.from(codes));

  const pendingSnap = await db.collection("pending_faculties").get();
  console.log("Pending count:", pendingSnap.size);

  process.exit(0);
})();
