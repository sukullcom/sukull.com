import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  try {
    console.log("Alternative upload API called");
    
    const formData = await request.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file uploaded" },
        { status: 400 }
      );
    }

    console.log("File received:", file.name, file.size, file.type);

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Invalid file type. Please upload an image file (JPG, PNG, GIF, WebP, SVG)" },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: "File too large. Maximum size is 5MB" },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExtension = path.extname(file.name).toLowerCase() || '.jpg';
    const uniqueId = randomUUID();
    const filename = `course-${uniqueId}${fileExtension}`;

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Use fs module differently
    const { existsSync, mkdirSync } = await import('fs');
    const { writeFile } = await import('fs/promises');
    
    // Create upload directory path
    const uploadDir = path.join(process.cwd(), 'public', 'course_logos');
    const filePath = path.join(uploadDir, filename);
    
    console.log("Paths:", { uploadDir, filePath });

    // Ensure upload directory exists (synchronous)
    if (!existsSync(uploadDir)) {
      console.log("Creating directory synchronously...");
      mkdirSync(uploadDir, { recursive: true });
      console.log("Directory created");
    }

    // Write file (asynchronous)
    console.log("Writing file...");
    await writeFile(filePath, buffer);
    console.log("File written successfully");

    // Return the public URL path
    const publicUrl = `/course_logos/${filename}`;

    return NextResponse.json({
      success: true,
      imageSrc: publicUrl,
      filename: filename
    });

  } catch (error) {
    console.error("Alternative upload error:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      cwd: process.cwd()
    });
    
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to upload image", 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 