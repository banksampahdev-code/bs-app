import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const user = requireAuth(request);
  if (user instanceof Response) return user;

  try {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

    let stats: any = {};

    if (user.role === 'pengguna') {
      // Stats untuk pengguna
      const { data: setoran } = await supabaseAdmin
        .from('setoran_sampah')
        .select('*')
        .eq('user_id', user.id);

      const { data: pencairan } = await supabaseAdmin
        .from('pencairan_saldo')
        .select('*')
        .eq('user_id', user.id);

      stats = {
        totalSetoran: setoran?.length || 0,
        setoranPending: setoran?.filter(s => s.status === 'pending').length || 0,
        setoranValidated: setoran?.filter(s => s.status === 'validated').length || 0,
        setoranBulanIni: setoran?.filter(s => 
          s.tanggal_setor >= firstDayOfMonth && s.tanggal_setor <= lastDayOfMonth
        ).length || 0,
        totalPencairan: pencairan?.filter(p => p.status === 'approved')
          .reduce((sum, p) => sum + parseFloat(p.nominal), 0) || 0,
        pencairanPending: pencairan?.filter(p => p.status === 'pending').length || 0
      };

    } else if (user.role === 'pengelola') {
      // Stats untuk pengelola
      const { data: setoran } = await supabaseAdmin
        .from('setoran_sampah')
        .select('*');

      const { data: pencairan } = await supabaseAdmin
        .from('pencairan_saldo')
        .select('*');

      const { count: totalUsers } = await supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'pengguna');

      stats = {
        totalSetoran: setoran?.length || 0,
        setoranPending: setoran?.filter(s => s.status === 'pending').length || 0,
        setoranValidated: setoran?.filter(s => s.status === 'validated').length || 0,
        setoranBulanIni: setoran?.filter(s => 
          s.tanggal_setor >= firstDayOfMonth && s.tanggal_setor <= lastDayOfMonth
        ).length || 0,
        pencairanPending: pencairan?.filter(p => p.status === 'pending').length || 0,
        totalUsers: totalUsers || 0
      };

    } else {
      // Stats untuk admin
      const { data: setoran } = await supabaseAdmin
        .from('setoran_sampah')
        .select('*');

      const { data: pencairan } = await supabaseAdmin
        .from('pencairan_saldo')
        .select('*');

      const { count: totalUsers } = await supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true });

      const { count: totalPengelola } = await supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'pengelola');

      const totalSampahKg = setoran
        ?.filter(s => s.status === 'validated')
        .reduce((sum, s) => sum + (parseFloat(s.berat_sampah) || 0), 0) || 0;

      stats = {
        totalSetoran: setoran?.length || 0,
        setoranValidated: setoran?.filter(s => s.status === 'validated').length || 0,
        setoranBulanIni: setoran?.filter(s => 
          s.tanggal_setor >= firstDayOfMonth && s.tanggal_setor <= lastDayOfMonth
        ).length || 0,
        totalUsers: totalUsers || 0,
        totalPengelola: totalPengelola || 0,
        totalSampahKg: totalSampahKg.toFixed(2),
        totalPencairan: pencairan?.filter(p => p.status === 'approved')
          .reduce((sum, p) => sum + parseFloat(p.nominal), 0) || 0
      };
    }

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}