export interface User {
  id: string;
  nama_lengkap: string;
  email: string;
  no_hp?: string;
  kelurahan?: string;
  kecamatan?: string;
  kabupaten?: string;
  detail_alamat?: string;
  role: 'admin' | 'pengelola' | 'pengguna';
  qr_code?: string;   // QR code image (Data URL)
  qr_data?: string;   // QR code data string for scanning
  saldo: number;
  created_at: string;
  updated_at: string;
}

export interface Setoran {
  id: string;
  user_id: string;
  jenis_sampah: string;
  berat_sampah?: number;
  harga_per_kg?: number;
  total_harga?: number;
  metode: 'pick-up' | 'drop-off';
  status: 'pending' | 'validated' | 'rejected';
  pengelola_id?: string;
  tanggal_setor: string;
  tanggal_validasi?: string;
  users?: {
    nama_lengkap: string;
    email: string;
    no_hp?: string;
  };
  pengelola?: {
    nama_lengkap: string;
  };
}

export interface Pencairan {
  id: string;
  user_id: string;
  nominal: number;
  status: 'pending' | 'approved' | 'rejected';
  pengelola_id?: string;
  tanggal_request: string;
  tanggal_pencairan?: string;
  catatan?: string;
  users?: {
    nama_lengkap: string;
    email: string;
    no_hp?: string;
  };
  pengelola?: {
    nama_lengkap: string;
  };
}

export interface Artikel {
  id: string;
  judul: string;
  konten: string;
  gambar?: string;
  admin_id: string;
  created_at: string;
  updated_at: string;
}