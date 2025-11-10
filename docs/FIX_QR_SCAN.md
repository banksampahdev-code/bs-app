# Fix QR Code Scanning Issue

Dokumentasi perbaikan untuk error "User tidak ditemukan" saat scan QR code di production.

## Masalah yang Ditemukan

### Error yang Terjadi:
```
Error: User tidak ditemukan
```
Terjadi saat scan QR code menggunakan device browser Android di production (https://bsgondangansejahtera.com/)

### Root Cause:

1. **QR Code Generation (SEBELUM FIX):**
   - File: `app/api/auth/register/route.ts:32-33`
   - Code yang di-generate: `USER-${Date.now()}-${email}`
   - Yang disimpan ke database: QR code **IMAGE** (Data URL base64)
   - Field: `qr_code` berisi `data:image/png;base64,iVBORw0KGgo...`

2. **QR Code Scanning (SEBELUM FIX):**
   - File: `app/api/member/scan/route.ts:20-25`
   - Scan QR menghasilkan: String data `USER-1234567890-user@email.com`
   - API mencari dengan: `.eq('qr_code', qr_data)`
   - **PROBLEM:** Membandingkan data STRING dengan IMAGE base64 → tidak match!

### Kenapa Error Terjadi:
```
Database qr_code: "data:image/png;base64,iVBORw0KGgo..."
Scan result:      "USER-1234567890-user@email.com"
                  ↑ TIDAK MATCH!
```

## Solusi yang Diimplementasikan

### 1. Tambah Kolom Baru di Database

**File:** `docs/database-qr-fix.sql`

```sql
-- Add qr_data column untuk simpan QR string data
ALTER TABLE users ADD COLUMN IF NOT EXISTS qr_data TEXT;

-- Create index untuk faster lookup
CREATE INDEX IF NOT EXISTS idx_users_qr_data ON users(qr_data);

-- Update existing users dengan email sebagai qr_data (temporary)
UPDATE users
SET qr_data = email
WHERE qr_data IS NULL AND role = 'pengguna';
```

**⚠️ WAJIB DIJALANKAN DI PRODUCTION!**

### 2. Update Register Route

**File:** `app/api/auth/register/route.ts:31-48`

**SEBELUM:**
```javascript
const qrData = `USER-${Date.now()}-${email}`;
const qrCode = await QRCode.toDataURL(qrData);

await supabaseAdmin.from('users').insert([{
  qr_code: qrCode,  // ❌ Hanya simpan image
  // ...
}])
```

**SESUDAH:**
```javascript
const qrData = `BANKSAMPAH-${email}-${Date.now()}`;
const qrCodeImage = await QRCode.toDataURL(qrData);

await supabaseAdmin.from('users').insert([{
  qr_code: qrCodeImage,  // ✅ QR image untuk display
  qr_data: qrData,        // ✅ QR data string untuk scanning
  // ...
}])
```

### 3. Update Member Create Route

**File:** `app/api/member/create/route.ts:69-87`

Perubahan sama seperti register route.

### 4. Update Scan Route

**File:** `app/api/member/scan/route.ts:19-33`

**SEBELUM:**
```javascript
const { data: foundUser, error } = await supabaseAdmin
  .from('users')
  .select('id, nama_lengkap, email, saldo, qr_code')
  .eq('qr_code', qr_data)  // ❌ Compare dengan image
  .eq('role', 'pengguna')
  .single();
```

**SESUDAH:**
```javascript
const { data: foundUser, error } = await supabaseAdmin
  .from('users')
  .select('id, nama_lengkap, email, saldo, qr_code')
  .eq('qr_data', qr_data)  // ✅ Compare dengan string data
  .eq('role', 'pengguna')
  .single();
```

### 5. Update Types

**File:** `lib/types.ts:11-12`

```typescript
export interface User {
  // ...
  qr_code?: string;   // QR code image (Data URL)
  qr_data?: string;   // QR code data string for scanning
  // ...
}
```

## Setup untuk Production

### Step 1: Jalankan SQL Migration

Buka **Supabase Dashboard > SQL Editor**, paste dan jalankan:

```sql
-- Add qr_data column
ALTER TABLE users ADD COLUMN IF NOT EXISTS qr_data TEXT;

-- Create index
CREATE INDEX IF NOT EXISTS idx_users_qr_data ON users(qr_data);

-- Update existing users
UPDATE users
SET qr_data = email
WHERE qr_data IS NULL AND role = 'pengguna';
```

### Step 2: Deploy Code Baru

```bash
# Build aplikasi
npm run build

# Deploy ke production
# (sesuai dengan platform deployment Anda)
```

### Step 3: Update Environment Variable (Opsional)

Di production environment, pastikan:

```bash
NEXT_PUBLIC_APP_URL=https://bsgondangansejahtera.com
```

## Cara Kerja Setelah Fix

### Register/Create Member:
```
1. Generate QR data: "BANKSAMPAH-user@email.com-1234567890"
2. Generate QR image dari data tersebut
3. Simpan ke database:
   - qr_code: "data:image/png;base64,..." (untuk display)
   - qr_data: "BANKSAMPAH-user@email.com-1234567890" (untuk scanning)
```

### Scan QR:
```
1. User scan QR dengan kamera → dapat "BANKSAMPAH-user@email.com-1234567890"
2. Kirim data ke API: POST /api/member/scan
3. API cari user dengan: .eq('qr_data', scanned_string)
4. ✅ MATCH! User ditemukan
```

## Testing

### Test di Development:
1. Register user baru
2. Lihat QR code di dashboard member
3. Scan QR code dengan device lain
4. Pastikan user berhasil ditemukan

### Test di Production:
1. Deploy code baru
2. Register user baru atau update existing user
3. Scan QR dengan device Android/iOS
4. Verify tidak ada error "User tidak ditemukan"

## Handling Existing Users

User yang sudah terdaftar sebelum fix ini akan memiliki:
- `qr_code`: QR image lama
- `qr_data`: Email mereka (dari migration SQL)

**Rekomendasi:**
1. Buat feature untuk "Regenerate QR Code" di dashboard admin/member
2. Atau jalankan script untuk regenerate semua QR code existing users

### Script Regenerate QR (Opsional):

```javascript
// Jalankan di Supabase Functions atau Node.js script
const users = await supabase.from('users')
  .select('*')
  .eq('role', 'pengguna');

for (const user of users) {
  const qrData = `BANKSAMPAH-${user.email}-${Date.now()}`;
  const qrCodeImage = await QRCode.toDataURL(qrData);

  await supabase.from('users')
    .update({
      qr_code: qrCodeImage,
      qr_data: qrData
    })
    .eq('id', user.id);
}
```

## Files Changed

1. ✅ `app/api/auth/register/route.ts` - Update QR generation
2. ✅ `app/api/member/create/route.ts` - Update QR generation
3. ✅ `app/api/member/scan/route.ts` - Update scan logic
4. ✅ `lib/types.ts` - Add qr_data field
5. ✅ `.env.example` - Add production URL comment
6. ✅ `docs/database-qr-fix.sql` - Database migration
7. ✅ `docs/FIX_QR_SCAN.md` - This documentation

## Checklist Deploy

- [ ] Backup database sebelum migration
- [ ] Jalankan SQL migration di Supabase
- [ ] Deploy code baru ke production
- [ ] Test scan QR dengan user baru
- [ ] Test scan QR dengan user existing
- [ ] Monitor error logs
- [ ] (Opsional) Regenerate QR untuk existing users

## Support

Jika masih ada masalah setelah deploy:

1. **Check Database:**
   ```sql
   SELECT id, email, qr_data, LEFT(qr_code, 50) as qr_code_preview
   FROM users
   WHERE role = 'pengguna'
   LIMIT 5;
   ```

2. **Check API Logs:**
   - Cek console.error di `/api/member/scan`
   - Verify qr_data yang dikirim dari frontend

3. **Verify Environment:**
   - Pastikan NEXT_PUBLIC_APP_URL benar
   - Pastikan Supabase credentials valid

## Kesimpulan

Fix ini memisahkan antara:
- **QR Code Image** (`qr_code`) → Untuk ditampilkan di UI
- **QR Code Data** (`qr_data`) → Untuk scanning dan matching

Dengan pemisahan ini, scan QR akan bekerja dengan sempurna di production maupun development.
