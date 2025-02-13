// app/api/private-lesson/group/score/route.ts
import { NextResponse } from "next/server";
import { updateEnglishGroupClassification } from "@/db/queries";

export async function PATCH(request: Request) {
  try {
    const { id, quizResult } = await request.json();
    if (!id) {
      return NextResponse.json({ message: "Missing id" }, { status: 400 });
    }
    if (quizResult == null) {
      return NextResponse.json({ message: "Missing quizResult" }, { status: 400 });
    }

    // Update row
    const updateRes = await updateEnglishGroupClassification(id, quizResult);
    if (updateRes.rowCount === 0) {
      return NextResponse.json({ message: "Record not found" }, { status: 404 });
    }

    // If we returned classification from queries
    // e.g. we do getCEFRClassification(quizResult) in queries
    // but let's do it here for demonstration:
    let classification = "";
    if (quizResult <= 10) classification = "A1";
    else if (quizResult <= 20) classification = "A2";
    else if (quizResult <= 30) classification = "B1";
    else if (quizResult <= 40) classification = "B2";
    else if (quizResult <= 45) classification = "C1";
    else classification = "C2";

    return NextResponse.json({ message: "Updated", classification }, { status: 200 });
  } catch (error) {
    console.error("Error in PATCH group/score:", error);
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}
