import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth";
import db from "@/db/drizzle";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isTeacher } from "@/db/queries";

// GET current teacher's Google Meet link
export async function GET() {
  try {
    const user = await getServerUser();
    
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    // Check if the user is a teacher
    const userIsTeacher = await isTeacher(user.id);
    if (!userIsTeacher) {
      return NextResponse.json({ message: "Only teachers can access this endpoint" }, { status: 403 });
    }
    
    // Get the user's record to fetch the meetLink
    const teacherData = await db.query.users.findFirst({
      where: eq(users.id, user.id),
      columns: {
        meetLink: true
      }
    });
    
    return NextResponse.json({ meetLink: teacherData?.meetLink || "" });
  } catch (error) {
    console.error("Error fetching teacher's Google Meet link:", error);
    return NextResponse.json({ message: "An error occurred." }, { status: 500 });
  }
}

// POST update teacher's Google Meet link
export async function POST(req: Request) {
  try {
    const user = await getServerUser();
    
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    // Check if the user is a teacher
    const userIsTeacher = await isTeacher(user.id);
    if (!userIsTeacher) {
      return NextResponse.json({ message: "Only teachers can update this information" }, { status: 403 });
    }
    
    const body = await req.json();
    const { meetLink } = body;
    
    if (typeof meetLink !== "string") {
      return NextResponse.json({ message: "Invalid meetLink format" }, { status: 400 });
    }
    
    // Validate the Google Meet link format
    const meetLinkRegex = /^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/;
    if (meetLink && !meetLinkRegex.test(meetLink)) {
      return NextResponse.json({ 
        message: "Invalid Google Meet link. Link should be in the format: https://meet.google.com/abc-defg-hij" 
      }, { status: 400 });
    }
    
    // Update the user's meetLink
    await db.update(users)
      .set({ 
        meetLink,
        updated_at: new Date()
      })
      .where(eq(users.id, user.id));
    
    return NextResponse.json({ 
      message: "Google Meet link updated successfully", 
      meetLink 
    });
  } catch (error) {
    console.error("Error updating teacher's Google Meet link:", error);
    return NextResponse.json({ message: "An error occurred." }, { status: 500 });
  }
} 