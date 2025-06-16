import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ 
    success: true,
    message: "Simple test route is working",
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return NextResponse.json({
      success: true,
      message: "POST request received",
      data: body,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: "Error parsing request body",
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 400 });
  }
} 