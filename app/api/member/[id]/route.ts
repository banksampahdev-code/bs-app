import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireRole } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = requireRole(request, ['admin', 'pengelola']);
  if (user instanceof Response) return user;

  try {
    // Get user data
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', params.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'Member tidak ditemukan' },
        { status: 404 }
      );
    }

    // Get setoran history
    const { data: setoranData } = await supabaseAdmin
      .from('setoran_sampah')
      .select('*')
      .eq('user_id', params.id)
      .order('tanggal_setor', { ascending: false })
      .limit(10);

    // Get pencairan history
    const { data: pencairanData } = await supabaseAdmin
      .from('pencairan_saldo')
      .select('*')
      .eq('user_id', params.id)
      .order('tanggal_request', { ascending: false })
      .limit(10);

    // Calculate stats
    const totalSetoran = setoranData?.length || 0;
    const totalValidated = setoranData?.filter(s => s.status === 'validated').length || 0;
    const totalPencairan = pencairanData?.filter(p => p.status === 'approved').reduce(
      (sum, p) => sum + parseFloat(p.nominal), 0
    ) || 0;

    return NextResponse.json({
      user: {
        ...userData,
        password: undefined // Don't send password
      },
      stats: {
        totalSetoran,
        totalValidated,
        totalPencairan
      },
      recentSetoran: setoranData,
      recentPencairan: pencairanData
    });

  } catch (error) {
    console.error('Member detail error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}