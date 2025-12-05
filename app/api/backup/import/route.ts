import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

type BackupPayload = {
  metadata?: {
    version?: string;
  };
  data?: {
    users?: any[];
    setoran?: any[];
    pencairan?: any[];
    artikel?: any[];
    settings?: any[];
    jenis_sampah?: any[];
  };
};

const toDate = (value: any) => {
  const d = new Date(value);
  return isNaN(d.getTime()) ? new Date() : d;
};

const toNumberString = (value: any, fallback = '0') => {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  if (Number.isNaN(num)) return fallback;
  return num.toString();
};

export async function POST(request: NextRequest) {
  const user = requireRole(request, ['admin']);
  if (user instanceof Response) return user;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'File backup tidak ditemukan' }, { status: 400 });
    }

    const content = await file.text();
    const parsed: BackupPayload = JSON.parse(content);

    if (!parsed.data) {
      return NextResponse.json({ error: 'Format backup tidak valid (data kosong)' }, { status: 400 });
    }

    const {
      users = [],
      setoran = [],
      pencairan = [],
      artikel = [],
      settings = [],
      jenis_sampah = [],
    } = parsed.data;

    // Hapus data lama terlebih dahulu (menggunakan urutan aman)
    await prisma.$transaction([
      prisma.setoranSampah.deleteMany(),
      prisma.pencairanSaldo.deleteMany(),
      prisma.artikel.deleteMany(),
      prisma.appSetting.deleteMany(),
      prisma.jenisSampah.deleteMany(),
      prisma.user.deleteMany(),
    ]);

    // Import data baru
    const results = await prisma.$transaction([
      prisma.user.createMany({
        data: users.map((u) => ({
          id: u.id,
          nama_lengkap: u.nama_lengkap,
          email: u.email,
          password: u.password,
          no_hp: u.no_hp ?? null,
          kelurahan: u.kelurahan ?? null,
          kecamatan: u.kecamatan ?? null,
          kabupaten: u.kabupaten ?? null,
          detail_alamat: u.detail_alamat ?? null,
          role: u.role || 'pengguna',
          qr_code: u.qr_code ?? null,
          qr_data: u.qr_data ?? null,
          saldo: toNumberString(u.saldo, '0') ?? '0',
          profile_completed: Boolean(u.profile_completed),
          created_at: toDate(u.created_at),
          updated_at: toDate(u.updated_at),
        })),
      }),
      prisma.jenisSampah.createMany({
        data: jenis_sampah.map((j) => ({
          id: j.id,
          nama: j.nama,
          is_active: Boolean(j.is_active),
          created_at: toDate(j.created_at),
          updated_at: toDate(j.updated_at),
        })),
      }),
      prisma.appSetting.createMany({
        data: settings.map((s) => ({
          id: s.id,
          setting_key: s.setting_key,
          setting_value: s.setting_value,
          description: s.description ?? null,
          created_at: toDate(s.created_at),
          updated_at: toDate(s.updated_at),
        })),
      }),
      prisma.artikel.createMany({
        data: artikel.map((a) => ({
          id: a.id,
          judul: a.judul,
          konten: a.konten,
          gambar: a.gambar ?? null,
          admin_id: a.admin_id,
          created_at: toDate(a.created_at),
          updated_at: toDate(a.updated_at),
        })),
      }),
      prisma.setoranSampah.createMany({
        data: setoran.map((s) => ({
          id: s.id,
          user_id: s.user_id,
          jenis_sampah: s.jenis_sampah,
          berat_sampah: toNumberString(s.berat_sampah),
          harga_per_kg: toNumberString(s.harga_per_kg),
          total_harga: toNumberString(s.total_harga),
          metode: s.metode || 'pick-up',
          status: s.status || 'pending',
          pengelola_id: s.pengelola_id ?? null,
          tanggal_setor: toDate(s.tanggal_setor),
          tanggal_validasi: s.tanggal_validasi ? toDate(s.tanggal_validasi) : null,
        })),
      }),
      prisma.pencairanSaldo.createMany({
        data: pencairan.map((p) => ({
          id: p.id,
          user_id: p.user_id,
          nominal: toNumberString(p.nominal, '0') ?? '0',
          status: p.status || 'pending',
          pengelola_id: p.pengelola_id ?? null,
          tanggal_request: toDate(p.tanggal_request),
          tanggal_pencairan: p.tanggal_pencairan ? toDate(p.tanggal_pencairan) : null,
          catatan: p.catatan ?? null,
        })),
      }),
    ]);

    return NextResponse.json({
      message: 'Import data berhasil',
      inserted: {
        users: results[0].count,
        jenis_sampah: results[1].count,
        settings: results[2].count,
        artikel: results[3].count,
        setoran: results[4].count,
        pencairan: results[5].count,
      },
      metadata: parsed.metadata || {},
    });
  } catch (error: any) {
    console.error('Full import error:', error);
    return NextResponse.json(
      { error: error?.message || 'Gagal melakukan import data' },
      { status: 500 }
    );
  }
}
