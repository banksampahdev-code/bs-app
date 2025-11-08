import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const user = requireAuth(request);
  if (user instanceof Response) return user;

  try {
    const { jenis_sampah, metode } = await request.json();

    if (!jenis_sampah || !metode) {
      return NextResponse.json(
        { error: 'Data tidak lengkap' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('setoran_sampah')
      .insert([{
        user_id: user.id,
        jenis_sampah,
        metode,
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
      message: 'Setoran berhasil dibuat',
      data
    }, { status: 201 });

  } catch (error) {
    console.error('Create setoran error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}