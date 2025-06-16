import { NextResponse } from "next/server";

export async function GET() {
  console.log('=== TEST API ROUTE HIT ===');
  return NextResponse.json({ 
    message: "Test route working",
    timestamp: new Date().toISOString()
  });
}

export async function POST() {
  console.log('=== TEST API POST ROUTE HIT ===');
  return NextResponse.json({ 
    message: "Test POST route working",
    timestamp: new Date().toISOString()
  });
} 