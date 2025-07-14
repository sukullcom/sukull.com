import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file uploaded" },
        { status: 400 }
      );
    }

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
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const uniqueId = randomUUID();
    const filename = `course-${uniqueId}.${fileExtension}`;

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create upload directory path
    const uploadDir = join(process.cwd(), 'public', 'course_logos');
    const filePath = join(uploadDir, filename);

    // Ensure upload directory exists
    const { mkdir } = await import('fs/promises');
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch {
      // Directory might already exist, which is fine
      console.log("Upload directory already exists or created");
    }

    // Write file to public directory
    await writeFile(filePath, buffer);

    // Return the public URL path
    const publicUrl = `/course_logos/${filename}`;

    return NextResponse.json({
      success: true,
      imageSrc: publicUrl,
      filename: filename
    });

  } catch (error) {
    console.error("Error uploading image:", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload image" },
      { status: 500 }
    );
  }
} 