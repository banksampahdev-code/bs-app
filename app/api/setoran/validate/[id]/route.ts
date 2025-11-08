import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireRole } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = requireRole(request, ['admin', 'pengelola']);
  if (user instanceof Response) return user;

  try {
    const { berat_sampah, harga_per_kg } = await request.json();

    if (!berat_sampah || !harga_per_kg) {
      return NextResponse.json(
        { error: 'Data tidak lengkap' },
        { status: 400 }
      );
    }

    const total_harga = parseFloat(berat_sampah) * parseFloat(harga_per_kg);

    // Update setoran
    const { data: setoran, error: setoranError } = await supabaseAdmin
      .from('setoran_sampah')
      .update({
        berat_sampah,
        harga_per_kg,
        total_harga,
        status: 'validated',
        pengelola_id: user.id,
        tanggal_validasi: new Date().toISOString()
      })
      .eq('id', params.id)
      .select('user_id')
      .single();

    if (setoranError) {
      return NextResponse.json(
        { error: setoranError.message },
        { status: 400 }
      );
    }

    // Update saldo user
    const { error: saldoError } = await supabaseAdmin.rpc('increment_saldo', {
      user_uuid: setoran.user_id,
      amount: total_harga
    });

    if (saldoError) {
      console.error('Update saldo error:', saldoError);
      // Fallback manual update
      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('saldo')
        .eq('id', setoran.user_id)
        .single();

      if (userData) {
        await supabaseAdmin
          .from('users')
          .update({ saldo: parseFloat(userData.saldo) + total_harga })
          .eq('id', setoran.user_id);
      }
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