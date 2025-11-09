import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import QRCode from 'qrcode';
import { requireRole } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication and check if user is admin
    const user = requireRole(request, ['admin']);
    if (user instanceof Response) {
      return user;
    }

    const body = await request.json();
    const {
      nama_lengkap,
      email,
      password,
      no_hp,
      kelurahan,
      kecamatan,
      kabupaten,
      detail_alamat,
      role
    } = body;

    // Validasi input
    if (!nama_lengkap || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Nama lengkap, email, password, dan role wajib diisi' },
        { status: 400 }
      );
    }

    // Validasi role hanya bisa pengguna atau pengelola
    if (role !== 'pengguna' && role !== 'pengelola') {
      return NextResponse.json(
        { error: 'Role hanya bisa pengguna atau pengelola' },
        { status: 400 }
      );
    }

    // Validasi panjang password
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password minimal 8 karakter' },
        { status: 400 }
      );
    }

    // Cek apakah email sudah ada
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate QR Code
    const qrData = `USER-${Date.now()}-${email}`;
    const qrCode = await QRCode.toDataURL(qrData);

    // Buat user baru
    const { data: newUser, error: createError } = await supabaseAdmin
      .from('users')
      .insert([
        {
          nama_lengkap,
          email,
          password: hashedPassword,
          no_hp: no_hp || null,
          kelurahan: kelurahan || null,
          kecamatan: kecamatan || null,
          kabupaten: kabupaten || null,
          detail_alamat: detail_alamat || null,
          qr_code: qrCode,
          role,
          saldo: 0,
        },
      ])
      .select()
      .single();

    if (createError) {
      console.error('Create user error:', createError);
      return NextResponse.json(
        { error: 'Gagal membuat akun' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Akun berhasil dibuat',
      user: {
        id: newUser.id,
        nama_lengkap: newUser.nama_lengkap,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
