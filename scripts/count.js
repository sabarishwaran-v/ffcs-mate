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
  const pendingSnapshot = await db.collection("pending_faculties").get();
  let pendingCount = 0;
  pendingSnapshot.forEach(doc => {
    const data = doc.data();
    if (data.courseName && data.courseName.toLowerCase().includes("artificial intelligence")) {
      pendingCount++;
    }
  });

  const approvedSnapshot = await db.collection("approved_faculties").get();
  let approvedCount = 0;
  approvedSnapshot.forEach(doc => {
    const data = doc.data();
    if (data.courseName && data.courseName.toLowerCase().includes("artificial intelligence")) {
      approvedCount++;
    }
  });

  console.log("\n==================================");
  console.log(`✅ Artificial Intelligence Slots`);
  console.log(`Pending: ${pendingCount} slots`);
  console.log(`Approved: ${approvedCount} slots`);
  console.log(`Total: ${pendingCount + approvedCount} slots`);
  console.log("==================================\n");
  process.exit(0);
})();
