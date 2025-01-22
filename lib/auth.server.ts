// lib/auth.ts
"use server"
import { cookies } from "next/headers";
import { verifyIdToken } from "./firebaseAdmin";

export async function getServerUser() {
  // İstemcide oturum açıldığında,
  // bir "token" cookie’si oluşturduğunuzu varsayıyoruz.
  // Bu cookie'yi çekip decode ediyoruz.
  const token = cookies().get("token")?.value;
  if (!token) return null;

  try {
    const decoded = await verifyIdToken(token);
    // decoded.uid => Firebase user ID
    // decoded.email => Firebase email vb.
    return decoded; 
  } catch (err) {
    console.error("getServerUser error:", err);
    return null;
  }
}
