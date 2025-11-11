import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireRole } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication and check if user is admin
    const user = requireRole(request, ['admin']);
    if (user instanceof Response) {
      return user;
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'User ID diperlukan' },
        { status: 400 }
      );
    }

    // Cek apakah user ada
    const { data: targetUser, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('id', id)
      .single();

    if (fetchError || !targetUser) {
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    // Cegah penghapusan akun admin
    if (targetUser.role === 'admin') {
      return NextResponse.json(
        { error: 'Tidak dapat menghapus akun admin' },
        { status: 403 }
      );
    }

    // Hapus data terkait secara manual (cascade delete)
    // 1. Hapus semua setoran sampah user ini
    const { error: deleteSetoranError } = await supabaseAdmin
      .from('setoran_sampah')
      .delete()
      .eq('user_id', id);

    if (deleteSetoranError) {
      console.error('Delete setoran error:', deleteSetoranError);
      return NextResponse.json(
        { error: 'Gagal menghapus data setoran terkait' },
        { status: 500 }
      );
    }

    // 2. Hapus semua pencairan saldo user ini
    const { error: deletePencairanError } = await supabaseAdmin
      .from('pencairan_saldo')
      .delete()
      .eq('user_id', id);

    if (deletePencairanError) {
      console.error('Delete pencairan error:', deletePencairanError);
      return NextResponse.json(
        { error: 'Gagal menghapus data pencairan terkait' },
        { status: 500 }
      );
    }

    // 3. Hapus user setelah semua data terkait terhapus
    const { error: deleteError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Delete user error:', deleteError);
      return NextResponse.json(
        { error: 'Gagal menghapus akun' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Akun berhasil dihapus',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
