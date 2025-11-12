import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireRole } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const user = requireRole(request, ['admin']);
  if (user instanceof Response) return user;

  try {
    const { judul, konten, gambar } = await request.json();

    if (!judul || !konten) {
      return NextResponse.json(
        { error: 'Judul dan konten harus diisi' },
        { status: 400 }
      );
    }

    // gambar bisa berupa string (legacy URL) atau object dengan multiple sizes
    let gambarData = gambar;
    if (typeof gambar === 'object' && gambar !== null) {
      // Jika gambar adalah object dengan desktop, tablet, mobile URLs
      // Simpan sebagai JSON string
      gambarData = JSON.stringify(gambar);
    }

    const { data, error } = await supabaseAdmin
      .from('artikel')
      .insert([{
        judul,
        konten,
        gambar: gambarData,
        admin_id: user.id
      }])
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: 'Artikel berhasil dibuat',
      data
    }, { status: 201 });

  } catch (error) {
    console.error('Create artikel error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}