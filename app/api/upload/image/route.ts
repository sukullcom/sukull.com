import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { isAdmin } from '@/lib/admin';
import { getServerUser } from '@/lib/auth';
import {
  checkRateLimit,
  getClientIp,
  rateLimitHeaders,
  RATE_LIMITS,
} from '@/lib/rate-limit-db';
import { getRequestLogger } from '@/lib/logger';

/**
 * Admin-only image upload. Storage quota is a hard cost boundary, so we
 * rate-limit by user-id when available, falling back to IP. 10/hour is
 * comfortably above normal usage (a course builder adds ~5 images per
 * session) but blocks runaway scripts.
 */
async function enforceUploadRateLimit(request: NextRequest): Promise<NextResponse | null> {
  const user = await getServerUser();
  const scope = user?.id ? `user:${user.id}` : `ip:${getClientIp(request)}`;
  const rl = await checkRateLimit({
    key: `image-upload:${scope}`,
    ...RATE_LIMITS.imageUpload,
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: 'Çok fazla yükleme denemesi. Lütfen biraz bekleyin.' },
      { status: 429, headers: rateLimitHeaders(rl) },
    );
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const limited = await enforceUploadRateLimit(request);
    if (limited) return limited;

    const formData = await request.formData();
    const file: File | null = formData.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type. SVG is intentionally excluded: even if CSP's
    // image sandbox blocks inline scripts when the file is rendered via
    // `next/image`, a direct fetch of the Supabase URL (e.g. from an
    // `<img>` tag or window navigation) would still execute embedded
    // scripts. Accepting SVG widens the XSS surface for no product gain —
    // all legitimate course/avatar assets are raster.
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        success: false,
        error: 'Geçersiz dosya türü. Sadece JPEG, PNG ve WebP desteklenir.',
      }, { status: 400 });
    }

    // Defence-in-depth: also reject SVG extensions (file.type can be
    // spoofed; the extension is what the storage layer writes to disk and
    // what users see in URLs).
    const rawName = typeof file.name === 'string' ? file.name : '';
    const extension = rawName.split('.').pop()?.toLowerCase() ?? '';
    const allowedExtensions = new Set(['jpg', 'jpeg', 'png', 'webp']);
    if (!allowedExtensions.has(extension)) {
      return NextResponse.json({
        success: false,
        error: 'Geçersiz dosya uzantısı.',
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
      const log = await getRequestLogger({ labels: { route: 'api/upload/image', op: 'POST' } });
      log.error({ message: 'supabase upload failed', error, location: 'api/upload/image/POST' });
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
    const log = await getRequestLogger({ labels: { route: 'api/upload/image', op: 'POST' } });
    log.error({ message: 'upload image failed', error, location: 'api/upload/image/POST' });
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to upload image' 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

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
      const log = await getRequestLogger({ labels: { route: 'api/upload/image', op: 'DELETE' } });
      log.error({ message: 'supabase delete failed', error, location: 'api/upload/image/DELETE', fields: { imageUrl } });
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
    const log = await getRequestLogger({ labels: { route: 'api/upload/image', op: 'DELETE' } });
    log.error({ message: 'delete image failed', error, location: 'api/upload/image/DELETE' });
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to delete image' 
    }, { status: 500 });
  }
} 