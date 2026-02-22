import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

// SVG removed: SVG files can contain embedded JavaScript (XSS vector)
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    // Sanitize folder to prevent path traversal (only allow alphanumeric, hyphens, underscores)
    const rawFolder = (formData.get('folder') as string) || 'general';
    const folder = rawFolder.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 50) || 'general';

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ success: false, error: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF' }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ success: false, error: 'File too large. Max 5MB.' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const bucket = process.env.NEXT_PUBLIC_STORAGE_BUCKET || 'budabook-assets';

    // Ensure the bucket exists — create it if it doesn't
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === bucket);

    if (!bucketExists) {
      const { error: createError } = await supabase.storage.createBucket(bucket, {
        public: true,
        fileSizeLimit: MAX_SIZE,
        allowedMimeTypes: ALLOWED_TYPES,
      });
      if (createError) {
        console.error('Bucket creation error:', createError);
        return NextResponse.json(
          { success: false, error: 'Failed to initialize storage. Please create a storage bucket named "' + bucket + '" in Supabase Dashboard > Storage.' },
          { status: 500 }
        );
      }
    }

    // Derive extension from validated MIME type (not user-provided filename)
    const mimeToExt: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
    };
    const ext = mimeToExt[file.type] || 'jpg';
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const filePath = `${session.tenant_id}/${folder}/${timestamp}-${randomStr}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({ success: false, error: uploadError.message }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      data: {
        url: urlData.publicUrl,
        path: filePath,
        size: file.size,
        type: file.type,
      },
    });
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
