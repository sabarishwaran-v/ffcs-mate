import { getAdminDb } from "../lib/firebase-admin";
import * as dotenv from "dotenv";

// Load .env.local manually
dotenv.config({ path: ".env.local" });

async function main() {
  const db = getAdminDb();
  
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
}

main().catch(console.error);
