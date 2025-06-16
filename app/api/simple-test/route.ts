import { NextResponse } from "next/server";

export async function GET() {
  console.log('=== SIMPLE TEST API ROUTE HIT ===');
  return NextResponse.json({ 
    message: "Simple test route working",
    timestamp: new Date().toISOString()
  });
}

export async function POST() {
  console.log('=== SIMPLE TEST API POST ROUTE HIT ===');
  return NextResponse.json({ 
    message: "Simple test POST route working",
    timestamp: new Date().toISOString()
  });
} 