import { NextRequest, NextResponse } from 'next/server';
import { generateToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email dan password harus diisi' },
        { status: 400 }
      );
    }

    // Cari user berdasarkan email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error('User not found');
      return NextResponse.json(
        { error: 'Email atau password salah' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      console.error('Invalid password');
      return NextResponse.json(
        { error: 'Email atau password salah' },
        { status: 401 }
      );
    }

    // Normalize role to expected union
    const role: 'admin' | 'pengelola' | 'pengguna' =
      user.role === 'admin' || user.role === 'pengelola' || user.role === 'pengguna'
        ? user.role
        : 'pengguna';

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      role
    });

    console.log('Login successful for:', user.email, 'Role:', user.role);

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        nama_lengkap: user.nama_lengkap,
        email: user.email,
        role,
        saldo: Number(user.saldo ?? 0),
        qr_code: user.qr_code,
        profile_completed: user.profile_completed,
        no_hp: user.no_hp,
        kelurahan: user.kelurahan,
        kecamatan: user.kecamatan,
        kabupaten: user.kabupaten,
        detail_alamat: user.detail_alamat,
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
