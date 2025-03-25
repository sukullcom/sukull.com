import { NextResponse } from "next/server";

export async function GET() {
  try {
    return NextResponse.json({ message: "Test endpoint works!" });
  } catch (error) {
    console.error("Error in test endpoint:", error);
    return NextResponse.json({ message: "An error occurred." }, { status: 500 });
  }
} 