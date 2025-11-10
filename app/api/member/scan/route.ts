import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireRole } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const user = requireRole(request, ['admin', 'pengelola']);
  if (user instanceof Response) return user;

  try {
    const { qr_data } = await request.json();

    if (!qr_data) {
      return NextResponse.json(
        { error: 'QR data diperlukan' },
        { status: 400 }
      );
    }

    // Cari user berdasarkan qr_data (bukan qr_code yang berisi image)
    const { data: foundUser, error } = await supabaseAdmin
      .from('users')
      .select('id, nama_lengkap, email, saldo, qr_code')
      .eq('qr_data', qr_data)
      .eq('role', 'pengguna')
      .single();

    if (error || !foundUser) {
      console.error('User not found:', error);
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: foundUser.id,
      nama_lengkap: foundUser.nama_lengkap,
      email: foundUser.email,
      saldo: foundUser.saldo
    });

  } catch (error) {
    console.error('Scan QR error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
