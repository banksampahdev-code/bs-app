import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const user = requireRole(request, ['admin', 'pengelola']);
  if (user instanceof Response) return user;

  try {
    const { code } = await request.json();

    if (!code || code.length < 3) {
      return NextResponse.json(
        { error: 'Kode harus minimal 3 karakter' },
        { status: 400 }
      );
    }

    const normalizedCode = code.toLowerCase();

    // Uuid filter tidak mendukung endsWith, jadi filter di sisi app
    const candidates = await prisma.user.findMany({
      where: { role: 'pengguna' },
      select: {
        id: true,
        nama_lengkap: true,
        email: true,
        saldo: true
      }
    });

    const foundUser = candidates.find((u) =>
      u.id.toLowerCase().endsWith(normalizedCode)
    );

    if (!foundUser) {
      return NextResponse.json(
        { error: 'Kode tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: foundUser.id,
      nama_lengkap: foundUser.nama_lengkap,
      email: foundUser.email,
      saldo: Number(foundUser.saldo ?? 0)
    });

  } catch (error) {
    console.error('Search by code error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
