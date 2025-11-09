import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireRole } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = requireRole(request, ['admin', 'pengelola']);
  if (user instanceof Response) return user;

  try {
    const { id } = await params;
    const { berat_sampah, harga_per_kg } = await request.json();

    if (!berat_sampah || !harga_per_kg) {
      return NextResponse.json(
        { error: 'Data tidak lengkap' },
        { status: 400 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { error: 'ID setoran tidak valid' },
        { status: 400 }
      );
    }

    const total_harga = parseFloat(berat_sampah) * parseFloat(harga_per_kg);

    // Update setoran
    const { data: setoran, error: setoranError } = await supabaseAdmin
      .from('setoran_sampah')
      .update({
        berat_sampah: parseFloat(berat_sampah),
        harga_per_kg: parseFloat(harga_per_kg),
        total_harga,
        status: 'validated',
        pengelola_id: user.id,
        tanggal_validasi: new Date().toISOString()
      })
      .eq('id', id)
      .select('user_id')
      .single();

    if (setoranError) {
      console.error('Setoran update error:', setoranError);
      return NextResponse.json(
        { error: setoranError.message },
        { status: 400 }
      );
    }

    if (!setoran || !setoran.user_id) {
      return NextResponse.json(
        { error: 'Setoran tidak ditemukan atau user_id tidak valid' },
        { status: 400 }
      );
    }

    // Update saldo user - langsung manual update untuk reliability
    const { data: userData, error: getUserError } = await supabaseAdmin
      .from('users')
      .select('saldo')
      .eq('id', setoran.user_id)
      .single();

    if (getUserError) {
      console.error('Get user error:', getUserError);
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 400 }
      );
    }

    const newSaldo = parseFloat(userData.saldo || '0') + total_harga;

    const { error: updateSaldoError } = await supabaseAdmin
      .from('users')
      .update({ saldo: newSaldo })
      .eq('id', setoran.user_id);

    if (updateSaldoError) {
      console.error('Update saldo error:', updateSaldoError);
      return NextResponse.json(
        { error: 'Gagal update saldo' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: 'Setoran berhasil divalidasi',
      total_harga
    });

  } catch (error) {
    console.error('Validate setoran error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}