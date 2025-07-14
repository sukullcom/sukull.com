import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function GET() {
  try {
    console.log("Test upload API called");
    
    // Test basic path operations
    const cwd = process.cwd();
    console.log("Current working directory:", cwd);
    
    const uploadDir = join(cwd, 'public', 'course_logos');
    console.log("Upload directory path:", uploadDir);
    
    // Test directory creation
    try {
      await mkdir(uploadDir, { recursive: true });
      console.log("Directory creation successful");
    } catch (error) {
      console.log("Directory creation error:", error);
    }
    
    // Test file writing
    const testFilePath = join(uploadDir, 'test.txt');
    try {
      await writeFile(testFilePath, 'Hello World');
      console.log("File write successful");
    } catch (error) {
      console.log("File write error:", error);
      throw error;
    }
    
    return NextResponse.json({
      success: true,
      cwd,
      uploadDir,
      testFilePath,
      message: "Test completed successfully"
    });
    
  } catch (error) {
    console.error("Test failed:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : String(error),
        cwd: process.cwd()
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("Test POST upload API called");
    
    const formData = await request.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }
    
    console.log("File info:", {
      name: file.name,
      size: file.size,
      type: file.type
    });
    
    // Just return file info without trying to save
    return NextResponse.json({
      success: true,
      fileInfo: {
        name: file.name,
        size: file.size,
        type: file.type
      }
    });
    
  } catch (error) {
    console.error("Test POST failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 