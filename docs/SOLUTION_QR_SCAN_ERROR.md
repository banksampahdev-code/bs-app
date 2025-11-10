# SOLUSI: Error "User tidak ditemukan" saat Scan QR

## Masalah

Saat scan QR code di production (https://bsgondangansejahtera.com/), muncul error:

```
Error
User tidak ditemukan
```

## Root Cause

**SALAH PAHAM:** Bukan membuat **TABLE** `qr_data`, tapi harus ada **KOLOM** `qr_data` di table `users`!

### Penjelasan:

1. **QR Code Image** (`qr_code`): Menyimpan gambar QR dalam format Data URL (base64)
   - Contoh: `data:image/png;base64,iVBORw0KGgo...`

2. **QR Code Data** (`qr_data`): Menyimpan STRING data yang ada di dalam QR
   - Contoh: `BANKSAMPAH-user@email.com-1234567890`

Ketika scan QR, kamera membaca **STRING data**, bukan gambar. Jadi API harus mencari berdasarkan `qr_data` (string), bukan `qr_code` (image).

## Solusi - STEP BY STEP

### STEP 1: Backup Database

⚠️ **WAJIB!** Backup database dulu sebelum jalankan perubahan apapun!

Di Supabase Dashboard:
1. Klik **Database** → **Backups**
2. Atau export data manual dengan SQL:

```sql
-- Export semua users ke CSV (opsional)
COPY (SELECT * FROM users) TO '/tmp/users_backup.csv' CSV HEADER;
```

### STEP 2: Cek Struktur Database

1. Buka **Supabase Dashboard**
2. Pergi ke **SQL Editor**
3. Copy dan jalankan query ini:

```sql
-- Cek apakah kolom qr_data sudah ada
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('qr_code', 'qr_data')
ORDER BY column_name;
```

**Hasil yang diharapkan:**
```
column_name | data_type | is_nullable
------------|-----------|------------
qr_code     | text      | YES
qr_data     | text      | YES
```

Jika `qr_data` **TIDAK ADA**, lanjut ke STEP 3.

### STEP 3: Tambah Kolom qr_data

Di **Supabase SQL Editor**, jalankan:

```sql
-- Tambah kolom qr_data
ALTER TABLE users ADD COLUMN IF NOT EXISTS qr_data TEXT;

-- Buat index untuk performa
CREATE INDEX IF NOT EXISTS idx_users_qr_data ON users(qr_data);
```

Tunggu hingga selesai, lalu verify:

```sql
-- Verify kolom sudah ada
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name = 'qr_data';
```

### STEP 4: Cek User yang Tidak Punya qr_data

```sql
-- Lihat semua user yang qr_data nya NULL
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
```

Jika ada banyak user, lanjut ke STEP 5.

### STEP 5A: Solusi Cepat - Update qr_data dengan SQL

**PILIHAN 1 (CEPAT):** Update qr_data berdasarkan email dan created_at

⚠️ **CATATAN:** QR code IMAGE lama tidak akan match dengan qr_data baru. Tapi setidaknya scan akan jalan.

```sql
UPDATE users
SET qr_data = CONCAT('BANKSAMPAH-', email, '-', EXTRACT(EPOCH FROM created_at)::bigint * 1000)
WHERE role = 'pengguna'
AND (qr_data IS NULL OR qr_data = '');
```

Verify:

```sql
SELECT id, nama_lengkap, email, qr_data
FROM users
WHERE role = 'pengguna'
ORDER BY created_at DESC
LIMIT 5;
```

Semua user harus punya `qr_data` format: `BANKSAMPAH-email-timestamp`

### STEP 5B: Solusi Lengkap - Regenerate QR Code (RECOMMENDED)

**PILIHAN 2 (RECOMMENDED):** Regenerate QR code IMAGE dan DATA agar match sempurna.

1. Buka terminal di project folder
2. Pastikan file `.env` sudah ada dan berisi:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

3. Jalankan script:

```bash
node scripts/regenerate-qr-codes.js
```

4. Ketik `yes` untuk konfirmasi
5. Script akan:
   - Generate qr_data baru untuk semua user
   - Generate qr_code (image) yang match dengan qr_data
   - Update database

### STEP 6: Test Scan QR

1. **Test dengan User Baru:**
   - Buat user baru via register atau tambah member
   - Download QR code dari dashboard
   - Scan QR → harus berhasil find user

2. **Test dengan User Existing:**
   - Jika pakai STEP 5A: User harus download QR code BARU dari dashboard
   - Jika pakai STEP 5B: QR code sudah otomatis terupdate
   - Scan QR → harus berhasil find user

### STEP 7: Verify di Production

```sql
-- Cek total user dengan qr_data
SELECT
  role,
  COUNT(*) as total_users,
  COUNT(qr_data) as has_qr_data,
  COUNT(*) - COUNT(qr_data) as missing_qr_data
FROM users
GROUP BY role;
```

**Hasil yang diharapkan:**

```
role      | total_users | has_qr_data | missing_qr_data
----------|-------------|-------------|----------------
pengguna  | 50          | 50          | 0
pengelola | 5           | 5           | 0
admin     | 1           | 1           | 0
```

`missing_qr_data` harus **0** untuk role `pengguna`!

## Troubleshooting

### Error: "User tidak ditemukan" masih muncul

**Kemungkinan 1:** qr_data di database tidak match dengan data di QR code

Solusi:
```sql
-- Cek qr_data user tertentu
SELECT email, qr_data, LEFT(qr_code, 50) as qr_preview
FROM users
WHERE email = 'user@example.com';
```

**Kemungkinan 2:** QR code yang di-scan adalah QR code LAMA (sebelum fix)

Solusi:
- User harus download QR code BARU dari dashboard
- Atau jalankan script regenerate (STEP 5B)

**Kemungkinan 3:** Code di production belum ter-deploy

Solusi:
- Pastikan code di repo sudah di-push
- Deploy ulang ke production
- Verify dengan cek file `/api/member/scan/route.ts` menggunakan `.eq('qr_data', qr_data)`

### Script regenerate-qr-codes.js error

**Error:** `Cannot find module '@supabase/supabase-js'`

Solusi:
```bash
npm install
```

**Error:** `Missing Supabase credentials`

Solusi: Cek file `.env`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Files yang Sudah Diupdate

✅ `app/api/auth/register/route.ts` - Generate qr_code DAN qr_data
✅ `app/api/member/create/route.ts` - Generate qr_code DAN qr_data
✅ `app/api/member/scan/route.ts` - Query dengan qr_data
✅ `lib/types.ts` - Tambah field qr_data
✅ `docs/database-qr-fix.sql` - Migration SQL
✅ `docs/CHECK_AND_FIX_DATABASE.sql` - Script diagnosa
✅ `scripts/regenerate-qr-codes.js` - Script regenerate QR

## Kesimpulan

Setelah menjalankan semua STEP di atas:

1. ✅ Table `users` punya kolom `qr_data`
2. ✅ Semua user punya `qr_data` yang terisi
3. ✅ QR code scan akan berhasil menemukan user
4. ✅ Production app sudah jalan dengan sempurna

## Kontak

Jika masih ada masalah setelah menjalankan semua STEP:

1. Check logs di Supabase (realtime logs)
2. Check console browser saat scan QR
3. Verify lagi dengan query di STEP 7
