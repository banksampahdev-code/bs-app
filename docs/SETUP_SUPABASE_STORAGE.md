# Setup Supabase Storage untuk Artikel Images

Dokumen ini menjelaskan cara setup Supabase Storage untuk fitur upload gambar artikel.

## 1. Buat Storage Bucket

1. Buka Supabase Dashboard
2. Pilih project Anda
3. Klik **Storage** di menu sidebar
4. Klik **New bucket**
5. Masukkan nama bucket: `artikel-images`
6. **Public bucket**: Centang (karena gambar perlu diakses publik)
7. Klik **Create bucket**

## 2. Setup Storage Policy

Setelah bucket dibuat, Anda perlu setup policy untuk akses:

### Policy untuk Upload (Admin Only)

```sql
CREATE POLICY "Admin can upload artikel images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'artikel-images'
  AND (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin'
);
```

### Policy untuk Public Read

```sql
CREATE POLICY "Public can view artikel images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'artikel-images');
```

### Policy untuk Update/Delete (Admin Only)

```sql
CREATE POLICY "Admin can update artikel images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'artikel-images'
  AND (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin'
);

CREATE POLICY "Admin can delete artikel images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'artikel-images'
  AND (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin'
);
```

## 3. Struktur Folder di Storage

Gambar akan disimpan dengan struktur folder berikut:

```
artikel-images/
├── desktop/
│   ├── artikel-{timestamp}-{random}.jpg
│   └── ...
├── tablet/
│   ├── artikel-{timestamp}-{random}.jpg
│   └── ...
└── mobile/
    ├── artikel-{timestamp}-{random}.jpg
    └── ...
```

## 4. Ukuran Gambar

Sistem akan otomatis membuat 3 versi gambar:

- **Desktop**: 1200x630 px (aspect ratio 1.91:1) - < 100KB
- **Tablet**: 768x403 px (aspect ratio 1.91:1) - < 100KB
- **Mobile**: 480x252 px (aspect ratio 1.91:1) - < 100KB

## 5. Format Gambar

- Semua gambar akan di-convert ke format **JPEG**
- Quality: 0.8 (atau lebih rendah jika diperlukan untuk mencapai < 100KB)
- Gambar akan otomatis di-crop ke aspect ratio 1.91:1 dari tengah

## 6. Cara Menggunakan

### Upload Gambar Baru

1. Buka halaman Create/Edit Artikel
2. Klik area upload atau drag & drop gambar
3. Gambar akan otomatis:
   - Di-crop ke aspect ratio yang benar
   - Di-resize ke 3 ukuran berbeda
   - Di-compress hingga < 100KB
   - Di-upload ke Supabase Storage
4. Submit artikel dengan gambar yang sudah diupload

### Update Database Schema

Kolom `gambar` di tabel `artikel` sekarang support 2 format:

1. **Legacy**: String URL (backward compatible)
2. **New**: JSON object dengan format:
   ```json
   {
     "desktop": "https://...",
     "tablet": "https://...",
     "mobile": "https://..."
   }
   ```

Tidak perlu migrasi database, sistem sudah support backward compatibility.

## 7. Testing

Setelah setup, test dengan:

1. Upload gambar dengan ukuran besar (misalnya 5MB)
2. Verifikasi gambar ter-compress < 100KB di Storage
3. Verifikasi 3 versi gambar tersimpan di folder yang benar
4. Verifikasi gambar bisa diakses publik via URL

## 8. Troubleshooting

### Error "Failed to upload"

- Pastikan bucket `artikel-images` sudah dibuat
- Pastikan bucket diset sebagai **public**
- Pastikan storage policies sudah diterapkan

### Error "Unauthorized"

- Pastikan user yang upload adalah admin
- Verifikasi JWT token valid
- Cek storage policy untuk INSERT

### Gambar tidak muncul

- Verifikasi URL gambar di database
- Cek console browser untuk CORS errors
- Pastikan public read policy sudah aktif

## 9. Maintenance

### Cleanup Old Images

Jika mengganti gambar artikel, gambar lama tidak otomatis terhapus. Anda bisa membuat cron job untuk cleanup:

1. Query artikel dengan gambar format baru (JSON)
2. List semua file di storage
3. Hapus file yang tidak ada di database

### Monitor Storage Usage

- Cek storage usage di Supabase Dashboard
- Free tier: 1GB storage
- Upgrade jika diperlukan
