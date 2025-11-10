import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import QRCode from 'qrcode';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      nama_lengkap, 
      email, 
      password, 
      no_hp, 
      kelurahan, 
      kecamatan, 
      kabupaten, 
      detail_alamat 
    } = body;

    // Validasi input
    if (!nama_lengkap || !email || !password) {
      return NextResponse.json(
        { error: 'Data tidak lengkap' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate QR Code data (simple unique identifier)
    const qrData = `BANKSAMPAH-${email}-${Date.now()}`;
    const qrCodeImage = await QRCode.toDataURL(qrData);

    // Insert user ke database
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert([{
        nama_lengkap,
        email,
        password: hashedPassword,
        no_hp,
        kelurahan,
        kecamatan,
        kabupaten,
        detail_alamat,
        qr_code: qrCodeImage,  // QR image for display
        qr_data: qrData,        // QR data string for scanning
        role: 'pengguna'
      }])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: 'Registrasi berhasil',
      userId: data.id
    }, { status: 201 });

  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}