// lib/firebaseAdmin.ts
import admin from "firebase-admin";

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY || "{}"
  );
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export const adminAuth = admin.auth();

/** For verifying session cookies instead of ID tokens */
export async function verifySessionCookie(cookie: string) {
  return adminAuth.verifySessionCookie(cookie, true); // 'true' => checkRevoked
}
