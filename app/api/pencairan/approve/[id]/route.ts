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
    const { status, catatan } = await request.json();

    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Status tidak valid' },
        { status: 400 }
      );
    }

    // Get pencairan data
    const { data: pencairan, error: pencairanError } = await supabaseAdmin
      .from('pencairan_saldo')
      .select('*, users:user_id (saldo)')
      .eq('id', params.id)
      .single();

    if (pencairanError || !pencairan) {
      return NextResponse.json(
        { error: 'Pencairan tidak ditemukan' },
        { status: 404 }
      );
    }

    if (pencairan.status !== 'pending') {
      return NextResponse.json(
        { error: 'Pencairan sudah diproses' },
        { status: 400 }
      );
    }

    // Update pencairan status
    const { error: updateError } = await supabaseAdmin
      .from('pencairan_saldo')
      .update({
        status,
        pengelola_id: user.id,
        tanggal_pencairan: new Date().toISOString(),
        catatan
      })
      .eq('id', params.id);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 400 }
      );
    }

    // Jika approved, kurangi saldo user
    if (status === 'approved') {
      const currentSaldo = parseFloat(pencairan.users.saldo);
      const newSaldo = currentSaldo - parseFloat(pencairan.nominal);

      const { error: saldoError } = await supabaseAdmin
        .from('users')
        .update({ saldo: newSaldo })
        .eq('id', pencairan.user_id);

      if (saldoError) {
        console.error('Update saldo error:', saldoError);
        return NextResponse.json(
          { error: 'Gagal update saldo' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      message: `Pencairan berhasil ${status === 'approved' ? 'disetujui' : 'ditolak'}`
    });

  } catch (error) {
    console.error('Approve pencairan error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}