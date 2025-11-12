import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireRole } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = requireRole(request, ['admin']);
  if (user instanceof Response) return user;

  try {
    const { id } = await params;
    const { judul, konten, gambar } = await request.json();

    const updateData: any = {};
    if (judul) updateData.judul = judul;
    if (konten) updateData.konten = konten;

    if (gambar !== undefined) {
      // gambar bisa berupa string (legacy URL) atau object dengan multiple sizes
      if (typeof gambar === 'object' && gambar !== null) {
        // Jika gambar adalah object dengan desktop, tablet, mobile URLs
        // Simpan sebagai JSON string
        updateData.gambar = JSON.stringify(gambar);
      } else {
        updateData.gambar = gambar;
      }
    }

    const { data, error } = await supabaseAdmin
      .from('artikel')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: 'Artikel berhasil diupdate',
      data
    });

  } catch (error) {
    console.error('Update artikel error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}