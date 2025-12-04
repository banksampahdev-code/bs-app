import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const user = requireAuth(request);
  if (user instanceof Response) return user;

  try {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    let stats: any = {};

    if (user.role === 'pengguna') {
      // Stats untuk pengguna
      const [setoran, pencairan] = await Promise.all([
        prisma.setoranSampah.findMany({ where: { user_id: user.id } }),
        prisma.pencairanSaldo.findMany({ where: { user_id: user.id } })
      ]);

      stats = {
        totalSetoran: setoran?.length || 0,
        setoranPending: setoran?.filter(s => s.status === 'pending').length || 0,
        setoranValidated: setoran?.filter(s => s.status === 'validated').length || 0,
        setoranBulanIni: setoran?.filter(s => 
          new Date(s.tanggal_setor).getTime() >= firstDayOfMonth.getTime() &&
          new Date(s.tanggal_setor).getTime() <= lastDayOfMonth.getTime()
        ).length || 0,
        totalPencairan: pencairan?.filter(p => p.status === 'approved')
          .reduce((sum, p) => sum + Number(p.nominal), 0) || 0,
        pencairanPending: pencairan?.filter(p => p.status === 'pending').length || 0
      };

    } else if (user.role === 'pengelola') {
      // Stats untuk pengelola
      const [setoran, pencairan, totalUsers] = await Promise.all([
        prisma.setoranSampah.findMany(),
        prisma.pencairanSaldo.findMany(),
        prisma.user.count({ where: { role: 'pengguna' } })
      ]);

      stats = {
        totalSetoran: setoran?.length || 0,
        setoranPending: setoran?.filter(s => s.status === 'pending').length || 0,
        setoranValidated: setoran?.filter(s => s.status === 'validated').length || 0,
        setoranBulanIni: setoran?.filter(s => 
          new Date(s.tanggal_setor).getTime() >= firstDayOfMonth.getTime() &&
          new Date(s.tanggal_setor).getTime() <= lastDayOfMonth.getTime()
        ).length || 0,
        pencairanPending: pencairan?.filter(p => p.status === 'pending').length || 0,
        totalUsers: totalUsers || 0
      };

    } else {
      // Stats untuk admin
      const [setoran, pencairan, totalUsers, totalPengelola] = await Promise.all([
        prisma.setoranSampah.findMany(),
        prisma.pencairanSaldo.findMany(),
        prisma.user.count(),
        prisma.user.count({ where: { role: 'pengelola' } })
      ]);

      const totalSampahKg = setoran
        ?.filter(s => s.status === 'validated')
        .reduce((sum, s) => sum + (s.berat_sampah ? Number(s.berat_sampah) : 0), 0) || 0;

      stats = {
        totalSetoran: setoran?.length || 0,
        setoranValidated: setoran?.filter(s => s.status === 'validated').length || 0,
        setoranBulanIni: setoran?.filter(s => 
          new Date(s.tanggal_setor).getTime() >= firstDayOfMonth.getTime() &&
          new Date(s.tanggal_setor).getTime() <= lastDayOfMonth.getTime()
        ).length || 0,
        totalUsers: totalUsers || 0,
        totalPengelola: totalPengelola || 0,
        totalSampahKg: totalSampahKg.toFixed(2),
        totalPencairan: pencairan?.filter(p => p.status === 'approved')
          .reduce((sum, p) => sum + Number(p.nominal), 0) || 0
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
