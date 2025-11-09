import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const user = requireAuth(request);
  if (user instanceof Response) return user;

  try {
    const { nominal } = await request.json();

    if (!nominal || nominal <= 0) {
      return NextResponse.json(
        { error: 'Nominal tidak valid' },
        { status: 400 }
      );
    }

    // Check saldo user
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('saldo')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    if (parseFloat(userData.saldo) < nominal) {
      return NextResponse.json(
        { error: 'Saldo tidak mencukupi' },
        { status: 400 }
      );
    }

    // Create pencairan request
    const { data, error } = await supabaseAdmin
      .from('pencairan_saldo')
      .insert([{
        user_id: user.id,
        nominal,
        status: 'pending'
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
      message: 'Permintaan pencairan berhasil dibuat',
      data
    }, { status: 201 });

  } catch (error) {
    console.error('Request pencairan error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}