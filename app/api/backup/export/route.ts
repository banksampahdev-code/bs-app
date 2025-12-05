import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const user = requireRole(request, ['admin']);
  if (user instanceof Response) return user;

  try {
    const [users, setoran, pencairan, artikel, settings, jenisSampah] = await Promise.all([
      prisma.user.findMany({ orderBy: { created_at: 'asc' } }),
      prisma.setoranSampah.findMany({ orderBy: { tanggal_setor: 'asc' } }),
      prisma.pencairanSaldo.findMany({ orderBy: { tanggal_request: 'asc' } }),
      prisma.artikel.findMany({ orderBy: { created_at: 'asc' } }),
      prisma.appSetting.findMany({ orderBy: { setting_key: 'asc' } }),
      prisma.jenisSampah.findMany({ orderBy: { created_at: 'asc' } }),
    ]);

    const payload = {
      metadata: {
        version: '1.0',
        exported_at: new Date().toISOString(),
        source: process.env.NEXT_PUBLIC_APP_URL || 'unknown',
        counts: {
          users: users.length,
          setoran: setoran.length,
          pencairan: pencairan.length,
          artikel: artikel.length,
          settings: settings.length,
          jenis_sampah: jenisSampah.length,
        },
      },
      data: {
        users: users.map((u) => ({
          ...u,
          saldo: u.saldo ? u.saldo.toString() : '0',
        })),
        setoran: setoran.map((s) => ({
          ...s,
          berat_sampah: s.berat_sampah ? s.berat_sampah.toString() : null,
          harga_per_kg: s.harga_per_kg ? s.harga_per_kg.toString() : null,
          total_harga: s.total_harga ? s.total_harga.toString() : null,
        })),
        pencairan: pencairan.map((p) => ({
          ...p,
          nominal: p.nominal ? p.nominal.toString() : '0',
        })),
        artikel,
        settings,
        jenis_sampah: jenisSampah,
      },
    };

    const fileName = `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;

    return new Response(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Full export error:', error);
    return new Response(JSON.stringify({ error: 'Gagal melakukan export data' }), { status: 500 });
  }
}
