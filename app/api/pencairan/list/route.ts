import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const user = requireAuth(request);
  if (user instanceof Response) return user;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = supabaseAdmin
      .from('pencairan_saldo')
      .select(`
        *,
        users:user_id (nama_lengkap, email, no_hp),
        pengelola:pengelola_id (nama_lengkap)
      `)
      .order('tanggal_request', { ascending: false });

    // Filter berdasarkan role
    if (user.role === 'pengguna') {
      query = query.eq('user_id', user.id);
    }

    // Filter berdasarkan status jika ada
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('List pencairan error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}