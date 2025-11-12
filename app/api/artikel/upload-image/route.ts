import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireRole } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * API untuk upload gambar artikel ke Supabase Storage
 * Menerima 3 file: desktop, tablet, mobile
 * Return URLs untuk setiap ukuran
 */
export async function POST(request: NextRequest) {
  const user = requireRole(request, ['admin']);
  if (user instanceof Response) return user;

  try {
    const formData = await request.formData();
    const desktopFile = formData.get('desktop') as File;
    const tabletFile = formData.get('tablet') as File;
    const mobileFile = formData.get('mobile') as File;

    if (!desktopFile || !tabletFile || !mobileFile) {
      return NextResponse.json(
        { error: 'Semua ukuran gambar harus disediakan' },
        { status: 400 }
      );
    }

    // Validate file types
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (
      !validTypes.includes(desktopFile.type) ||
      !validTypes.includes(tabletFile.type) ||
      !validTypes.includes(mobileFile.type)
    ) {
      return NextResponse.json(
        { error: 'Format gambar harus JPEG, PNG, atau WebP' },
        { status: 400 }
      );
    }

    // Generate unique filename dengan timestamp
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const baseFilename = `artikel-${timestamp}-${randomString}`;

    const bucketName = 'artikel-images';

    // Upload desktop version
    const desktopBuffer = await desktopFile.arrayBuffer();
    const desktopPath = `desktop/${baseFilename}.jpg`;
    const { data: desktopData, error: desktopError } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(desktopPath, desktopBuffer, {
        contentType: 'image/jpeg',
        cacheControl: '31536000', // 1 year
        upsert: false,
      });

    if (desktopError) {
      console.error('Desktop upload error:', desktopError);
      return NextResponse.json(
        { error: `Gagal upload gambar desktop: ${desktopError.message}` },
        { status: 500 }
      );
    }

    // Upload tablet version
    const tabletBuffer = await tabletFile.arrayBuffer();
    const tabletPath = `tablet/${baseFilename}.jpg`;
    const { data: tabletData, error: tabletError } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(tabletPath, tabletBuffer, {
        contentType: 'image/jpeg',
        cacheControl: '31536000',
        upsert: false,
      });

    if (tabletError) {
      console.error('Tablet upload error:', tabletError);
      // Cleanup desktop file
      await supabaseAdmin.storage.from(bucketName).remove([desktopPath]);
      return NextResponse.json(
        { error: `Gagal upload gambar tablet: ${tabletError.message}` },
        { status: 500 }
      );
    }

    // Upload mobile version
    const mobileBuffer = await mobileFile.arrayBuffer();
    const mobilePath = `mobile/${baseFilename}.jpg`;
    const { data: mobileData, error: mobileError } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(mobilePath, mobileBuffer, {
        contentType: 'image/jpeg',
        cacheControl: '31536000',
        upsert: false,
      });

    if (mobileError) {
      console.error('Mobile upload error:', mobileError);
      // Cleanup previous files
      await supabaseAdmin.storage.from(bucketName).remove([desktopPath, tabletPath]);
      return NextResponse.json(
        { error: `Gagal upload gambar mobile: ${mobileError.message}` },
        { status: 500 }
      );
    }

    // Get public URLs
    const { data: { publicUrl: desktopUrl } } = supabaseAdmin.storage
      .from(bucketName)
      .getPublicUrl(desktopPath);

    const { data: { publicUrl: tabletUrl } } = supabaseAdmin.storage
      .from(bucketName)
      .getPublicUrl(tabletPath);

    const { data: { publicUrl: mobileUrl } } = supabaseAdmin.storage
      .from(bucketName)
      .getPublicUrl(mobilePath);

    return NextResponse.json({
      message: 'Gambar berhasil diupload',
      urls: {
        desktop: desktopUrl,
        tablet: tabletUrl,
        mobile: mobileUrl,
      },
    });
  } catch (error) {
    console.error('Upload image error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
