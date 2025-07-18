import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file: File | null = formData.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid file type. Only JPEG, PNG, SVG, and WebP are allowed.' 
      }, { status: 400 });
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        success: false, 
        error: 'File too large. Maximum size is 5MB.' 
      }, { status: 400 });
    }

    // Create unique filename with timestamp
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const filename = `course_${timestamp}.${extension}`;
    const filePath = filename; // Just the filename, since we're already in the course-images bucket

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = new Uint8Array(bytes);

    // Upload to Supabase Storage
    const supabase = await createClient();
    const { error } = await supabase.storage
      .from('course-images')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to upload image to storage' 
      }, { status: 500 });
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('course-images')
      .getPublicUrl(filePath);

    return NextResponse.json({ 
      success: true, 
      imageUrl: urlData.publicUrl,
      filename: filename
    });

  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to upload image' 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('imageUrl');

    if (!imageUrl) {
      return NextResponse.json({ success: false, error: 'No image URL provided' }, { status: 400 });
    }

    // Extract filename from the URL
    // URLs typically look like: https://[project-ref].supabase.co/storage/v1/object/public/course-images/course_1234567890.jpg
    const urlParts = imageUrl.split('/');
    const filename = urlParts[urlParts.length - 1];

    if (!filename || !filename.startsWith('course_')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid image URL format' 
      }, { status: 400 });
    }

    // Delete from Supabase Storage
    const supabase = await createClient();
    const { error } = await supabase.storage
      .from('course-images')
      .remove([filename]);

    if (error) {
      console.error('Supabase delete error:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to delete image from storage' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Image deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to delete image' 
    }, { status: 500 });
  }
} 