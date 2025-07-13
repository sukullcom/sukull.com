import { NextRequest } from "next/server";
import { secureApi, ApiResponses } from "@/lib/api-middleware";
import { bookLesson, hasAvailableCredits, isApprovedStudent } from "@/db/queries";

export const POST = secureApi.auth(async (request: NextRequest, user) => {
  try {
    // Check if user is an approved student
    const isStudent = await isApprovedStudent(user.id);
    if (!isStudent) {
      return ApiResponses.forbidden("Only approved students can book lessons");
    }
    
    const { teacherId, startTime, endTime } = await request.json();
    
    // Validate input
    if (!teacherId || !startTime || !endTime) {
      return ApiResponses.badRequest("Missing required fields: teacherId, startTime, endTime");
    }
    
    // Validate dates
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return ApiResponses.badRequest("Invalid date format");
    }
    
    if (startDate >= endDate) {
      return ApiResponses.badRequest("Start time must be before end time");
    }
    
    if (startDate <= new Date()) {
      return ApiResponses.badRequest("Cannot book lessons in the past");
    }
    
    // Check if user has sufficient credits
    const hasCredits = await hasAvailableCredits(user.id, 1);
    if (!hasCredits) {
      return ApiResponses.badRequest("Insufficient credits. Please purchase credits to book a lesson.");
    }
    
    // Book the lesson (this function handles credit deduction and validation)
    const booking = await bookLesson(user.id, teacherId, startDate, endDate);
    
    return ApiResponses.created({ 
      message: "Lesson booked successfully",
      booking: booking[0]
    });
    
  } catch (error) {
    console.error("Error booking lesson:", error);
    
    if (error instanceof Error) {
      if (error.message.includes("Insufficient credits")) {
        return ApiResponses.badRequest(error.message);
      }
      if (error.message.includes("already booked") || error.message.includes("not available")) {
        return ApiResponses.badRequest(error.message);
      }
    }
    
    return ApiResponses.serverError("An error occurred while booking the lesson");
  }
});

