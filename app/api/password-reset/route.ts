// app/api/password-reset/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Generate password reset link
    const actionCodeSettings = {
      url: `${process.env.NEXT_PUBLIC_APP_URL}/login`,
      handleCodeInApp: false,
    };
    const resetLink = await adminAuth.generatePasswordResetLink(email, actionCodeSettings);

    // Send the reset link via your preferred email service
    // Implement sendEmail accordingly
    // Example:
    // await sendEmail(email, "Password Reset", `Reset your password by clicking here: ${resetLink}`);

    console.log(`Password reset email sent to ${email}: ${resetLink}`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("password-reset error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
