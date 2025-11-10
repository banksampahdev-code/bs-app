-- ========================================
-- SCRIPT UNTUK CEK DAN FIX DATABASE
-- ========================================
-- Jalankan query ini di Supabase SQL Editor
-- untuk memperbaiki masalah QR scan

-- ========================================
-- STEP 1: CEK STRUKTUR TABLE USERS
-- ========================================
-- Query ini untuk cek apakah kolom qr_data sudah ada
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('qr_code', 'qr_data')
ORDER BY column_name;

-- Jika qr_data TIDAK ADA dalam hasil query di atas,
-- lanjutkan ke STEP 2

-- ========================================
-- STEP 2: TAMBAH KOLOM qr_data (Jika belum ada)
-- ========================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS qr_data TEXT;

-- ========================================
-- STEP 3: BUAT INDEX untuk performa
-- ========================================
CREATE INDEX IF NOT EXISTS idx_users_qr_data ON users(qr_data);

-- ========================================
-- STEP 4: CEK USER YANG TIDAK PUNYA qr_data
-- ========================================
-- Query ini menampilkan semua user pengguna yang qr_data nya NULL
SELECT
  id,
  nama_lengkap,
  email,
  role,
  qr_data,
  LEFT(qr_code, 30) as qr_code_preview,
  created_at
FROM users
WHERE role = 'pengguna'
AND (qr_data IS NULL OR qr_data = '')
ORDER BY created_at DESC;

-- ========================================
-- STEP 5: UPDATE EXISTING USERS dengan qr_data
-- ========================================
-- PENTING: Jalankan query ini untuk update semua user
-- yang belum punya qr_data

UPDATE users
SET qr_data = CONCAT('BANKSAMPAH-', email, '-', EXTRACT(EPOCH FROM created_at)::bigint * 1000)
WHERE role = 'pengguna'
AND (qr_data IS NULL OR qr_data = '');

-- ========================================
-- STEP 6: VERIFIKASI - Cek apakah semua user sudah punya qr_data
-- ========================================
SELECT
  id,
  nama_lengkap,
  email,
  qr_data,
  role,
  created_at
FROM users
WHERE role = 'pengguna'
ORDER BY created_at DESC
LIMIT 10;

-- Semua user pengguna harus punya qr_data yang terisi
-- Format: BANKSAMPAH-email@example.com-1234567890

-- ========================================
-- STEP 7: CEK TOTAL USER DENGAN QR DATA
-- ========================================
SELECT
  role,
  COUNT(*) as total_users,
  COUNT(qr_data) as has_qr_data,
  COUNT(*) - COUNT(qr_data) as missing_qr_data
FROM users
GROUP BY role;

-- Hasil yang diharapkan:
-- role: pengguna, total_users: X, has_qr_data: X, missing_qr_data: 0
