// lib/auth.ts
"use server";
import { cookies } from "next/headers";
import { verifySessionCookie } from "./firebaseAdmin";

export async function getServerUser() {
  const token = cookies().get("token")?.value;
  if (!token) return null;

  try {
    const decoded = await verifySessionCookie(token);
    return decoded; // { uid, email, ... }
  } catch (err) {
    console.error("getServerUser error:", err);
    return null;
  }
}
