import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireRole } from '@/lib/auth';
import * as XLSX from 'xlsx';

export async function GET(request: NextRequest) {
  const user = requireRole(request, ['admin', 'pengelola']);
  if (user instanceof Response) return user;

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'setoran';
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    let data: any[] = [];

    if (type === 'setoran') {
      let query = supabaseAdmin
        .from('setoran_sampah')
        .select(`
          *,
          users:user_id (nama_lengkap, email),
          pengelola:pengelola_id (nama_lengkap)
        `)
        .order('tanggal_setor', { ascending: false });

      if (startDate) {
        query = query.gte('tanggal_setor', startDate);
      }
      if (endDate) {
        query = query.lte('tanggal_setor', endDate);
      }

      const { data: result, error } = await query;
      if (error) throw error;

      data = result.map((item: any) => ({
        'Tanggal': new Date(item.tanggal_setor).toLocaleDateString('id-ID'),
        'Nama Pengguna': item.users?.nama_lengkap || '-',
        'Email': item.users?.email || '-',
        'Jenis Sampah': item.jenis_sampah,
        'Berat (kg)': item.berat_sampah || '-',
        'Harga/kg': item.harga_per_kg || '-',
        'Total': item.total_harga || '-',
        'Metode': item.metode,
        'Status': item.status,
        'Pengelola': item.pengelola?.nama_lengkap || '-'
      }));

    } else if (type === 'pencairan') {
      let query = supabaseAdmin
        .from('pencairan_saldo')
        .select(`
          *,
          users:user_id (nama_lengkap, email),
          pengelola:pengelola_id (nama_lengkap)
        `)
        .order('tanggal_request', { ascending: false });

      if (startDate) {
        query = query.gte('tanggal_request', startDate);
      }
      if (endDate) {
        query = query.lte('tanggal_request', endDate);
      }

      const { data: result, error } = await query;
      if (error) throw error;

      data = result.map((item: any) => ({
        'Tanggal Request': new Date(item.tanggal_request).toLocaleDateString('id-ID'),
        'Nama Pengguna': item.users?.nama_lengkap || '-',
        'Email': item.users?.email || '-',
        'Nominal': item.nominal,
        'Status': item.status,
        'Tanggal Pencairan': item.tanggal_pencairan ? 
          new Date(item.tanggal_pencairan).toLocaleDateString('id-ID') : '-',
        'Pengelola': item.pengelola?.nama_lengkap || '-',
        'Catatan': item.catatan || '-'
      }));
    }

    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    
    XLSX.utils.book_append_sheet(wb, ws, type === 'setoran' ? 'Setoran' : 'Pencairan');

    // Generate buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Return file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=laporan-${type}-${new Date().toISOString().split('T')[0]}.xlsx`
      }
    });

  } catch (error) {
    console.error('Export laporan error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}