const fs = require("fs");
const env = fs.readFileSync(".env.local", "utf8").split("\n").reduce((acc, line) => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) acc[match[1]] = match[2].replace(/^"|"$/g, "").replace(/\\n/g, "\n");
  return acc;
}, {});

const { initializeApp, cert } = require("firebase-admin/app");
const { getSecurityRules } = require("firebase-admin/security-rules");

initializeApp({
  credential: cert({
    projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: env.FIREBASE_CLIENT_EMAIL,
    privateKey: env.FIREBASE_PRIVATE_KEY
  })
});

const rulesSource = fs.readFileSync("firestore.rules", "utf8");

(async () => {
  try {
    const rules = getSecurityRules();
    const rulesFile = rules.createRulesFileFromSource("firestore.rules", rulesSource);
    const ruleset = await rules.createRuleset(rulesFile);
    
    await rules.releaseFirestoreRuleset(ruleset.name);
    console.log("Successfully deployed Firestore rules!");
    process.exit(0);
  } catch (err) {
    console.error("Failed to deploy rules:", err);
    process.exit(1);
  }
})();
