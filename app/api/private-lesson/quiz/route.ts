// app/api/private-lesson/quiz/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getQuizQuestionsByField } from "@/db/queries";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const field = searchParams.get("field");

  if (!field) {
    return NextResponse.json({ message: "Field is required." }, { status: 400 });
  }

  try {
    const questions = await getQuizQuestionsByField(field);
    return NextResponse.json({ questions }, { status: 200 });
  } catch (error) {
    console.error("Error fetching quiz questions:", error);
    return NextResponse.json({ message: "An error occurred." }, { status: 500 });
  }
}
