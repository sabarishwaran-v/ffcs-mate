import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

export function getAdminDb() {
  if (!getApps().length) {
    try {
      initializeApp({
        credential: cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "dummy-id",
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL || "dummy@example.com",
          privateKey: (
            process.env.FIREBASE_PRIVATE_KEY ||
            "-----BEGIN PRIVATE KEY-----\ndummy\n-----END PRIVATE KEY-----"
          ).replace(/\\n/g, "\n"),
        }),
      });
    } catch (error: any) {
      console.error("Firebase admin initialization error", error.stack);
    }
  }
  return getFirestore();
}
