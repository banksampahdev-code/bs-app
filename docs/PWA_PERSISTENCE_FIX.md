# PWA Session Persistence & Auto-Redirect

Dokumentasi perbaikan masalah logout otomatis di PWA dan implementasi auto-redirect untuk user yang sudah login.

## Masalah yang Diperbaiki

1. **Session Logout**: User selalu logout otomatis dan harus login ulang setiap kali membuka aplikasi PWA
2. **Landing Page**: User yang sudah login masih diarahkan ke landing page saat membuka app, bukan langsung ke dashboard

## Penyebab

1. **Zustand persist** tidak explicitly menggunakan localStorage
2. **Service Worker** meng-cache API calls yang seharusnya fresh
3. **Storage key** yang tidak unique bisa konflik dengan app lain
4. **Hydration** tidak berjalan dengan sempurna di PWA

## Solusi yang Diterapkan

### 1. Update Auth Store (`lib/store/authStore.ts`)

**Perubahan:**
- ✅ Explicitly menggunakan `createJSONStorage` dengan localStorage
- ✅ Custom storage dengan error handling & logging
- ✅ `partialize` untuk hanya persist `user` dan `token`
- ✅ Storage name yang unique: `bank-sampah-auth`
- ✅ Version control untuk future migrations
- ✅ Better hydration handling dengan logging

**Logging:**
- `🔑 Auth Storage - GET` - Saat membaca dari storage
- `💾 Auth Storage - SET` - Saat menyimpan ke storage
- `🔐 Setting auth` - Saat user login
- `👋 Logging out` - Saat user logout
- `🔄 Hydration starting...` - Saat mulai hydrate
- `✅ Hydration complete` - Saat hydration selesai

### 2. Update Service Worker (`public/sw.js`)

**Perubahan:**
- ✅ Skip caching untuk semua API calls (`/api/*`)
- ✅ Skip caching untuk Next.js data (`_next/data`)
- ✅ Skip caching untuk non-GET requests
- ✅ Always fetch fresh data untuk API

**Impact:**
- Session data selalu fresh dari server
- Tidak ada stale data dari cache
- localStorage tetap persist

### 3. Update PWA Manifest (`public/manifest.json`)

**Perubahan:**
- ✅ Add `scope: "/"` untuk PWA scope
- ✅ Add `prefer_related_applications: false`

## Cara Testing

### 1. Clear Old Data (One-time)

**Di Browser Desktop:**
1. Buka Developer Tools (F12)
2. Klik tab **Application**
3. Expand **Local Storage**
4. Hapus semua items (terutama `auth-storage`)
5. Expand **Cache Storage**
6. Hapus cache `bank-sampah-v1`
7. Klik **Service Workers**
8. Klik **Unregister** untuk SW lama
9. Refresh halaman (Ctrl+R atau Cmd+R)

**Di Mobile PWA:**
1. Uninstall aplikasi PWA lama
2. Clear browser cache & data
3. Install ulang PWA dari browser

### 2. Test Login & Persistence

1. **Login ke aplikasi**
   - Buka browser console
   - Cek log: `🔐 Setting auth`
   - Cek log: `💾 Auth Storage - SET`

2. **Tutup dan buka kembali aplikasi**
   - Buka browser console
   - Cek log: `🔄 Hydration starting...`
   - Cek log: `🔑 Auth Storage - GET: Found`
   - Cek log: `✅ Hydration complete: hasUser: true`

3. **Verifikasi session tetap aktif**
   - User tidak perlu login ulang
   - Data user masih tersimpan

### 3. Verify Storage in Browser

**Chrome/Edge:**
1. Buka DevTools (F12)
2. Tab **Application** > **Local Storage**
3. Cek key `bank-sampah-auth`
4. Harus ada data JSON dengan `user` dan `token`

**Example:**
```json
{
  "state": {
    "user": {
      "id": "...",
      "nama_lengkap": "...",
      "email": "...",
      "role": "pengguna",
      "saldo": 0
    },
    "token": "eyJ..."
  },
  "version": 1
}
```

## Troubleshooting

### Masih Logout Setelah Close App

1. **Cek Browser Console untuk error**
   ```
   - Lihat apakah ada error saat hydration
   - Cek apakah localStorage terblokir
   - Verify storage quotas tidak exceeded
   ```

2. **Verify localStorage tidak disabled**
   ```javascript
   // Test di console
   localStorage.setItem('test', '123');
   console.log(localStorage.getItem('test')); // Should return '123'
   localStorage.removeItem('test');
   ```

3. **Clear semua cache & reinstall PWA**
   - Uninstall PWA
   - Clear browser data (cache, localStorage, cookies)
   - Reinstall PWA

### Storage Quota Exceeded

Jika localStorage penuh:
```javascript
// Check storage usage
navigator.storage.estimate().then(estimate => {
  console.log(`Used: ${estimate.usage} bytes`);
  console.log(`Quota: ${estimate.quota} bytes`);
});
```

### Service Worker Issues

```javascript
// Unregister old SW
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(reg => reg.unregister());
});

// Force reload
window.location.reload(true);
```

## Best Practices untuk User

1. **Jangan gunakan mode Incognito/Private**
   - Mode private tidak menyimpan localStorage
   - Session akan hilang saat browser ditutup

2. **Jangan clear browser data terlalu sering**
   - Akan menghapus session tersimpan

3. **Update PWA secara berkala**
   - Tutup dan buka ulang app untuk update SW

4. **Cek koneksi internet saat pertama login**
   - Pastikan API call berhasil

## Monitoring

### Logs yang Normal

```
🔄 Hydration starting...
🔑 Auth Storage - GET: bank-sampah-auth Found
✅ Hydration complete: { hasUser: true, hasToken: true }
```

### Logs saat Login

```
🔐 Setting auth: { userId: "xxx", role: "pengguna" }
💾 Auth Storage - SET: bank-sampah-auth Saved successfully
```

### Logs saat Logout

```
👋 Logging out
🗑️ Auth Storage - REMOVE: bank-sampah-auth
```

## Update Version

Jika ada breaking changes di auth store di masa depan:

1. Update `version` number di `authStore.ts`
2. Add migration logic di `migrate` option
3. Notify users untuk re-login

```typescript
{
  name: 'bank-sampah-auth',
  version: 2, // Increment version
  migrate: (persistedState: any, version: number) => {
    if (version === 1) {
      // Migration logic from v1 to v2
      return {
        ...persistedState,
        // Add/modify fields
      };
    }
    return persistedState;
  }
}
```

## Auto-Redirect Implementation

### Routes dengan Protection

**Home Page (`/`)**
- ✅ Redirect ke `/dashboard` jika sudah login
- ✅ Tampilkan landing page jika belum login

**Login Page (`/login`)**
- ✅ Redirect ke `/dashboard` jika sudah login
- ✅ Tampilkan form login jika belum login

**Register Page (`/register`)**
- ✅ Redirect ke `/dashboard` jika sudah login
- ✅ Tampilkan form register jika belum login

### User Flow

**Scenario 1: User sudah login, buka PWA**
```
Open PWA (/) → Check auth → User detected → Redirect to /dashboard ✅
```

**Scenario 2: User belum login, buka PWA**
```
Open PWA (/) → Check auth → No user → Show landing page
```

**Scenario 3: User sudah login, coba akses /login**
```
Access /login → Check auth → User detected → Redirect to /dashboard ✅
```

**Scenario 4: User logout**
```
Click Logout → Clear session → Redirect to /login → Can't access dashboard
```

## Notes

- ✅ Session persist across PWA restarts
- ✅ Auto-redirect ke dashboard untuk user yang sudah login
- ✅ Token tidak expire (permanent login)
- ✅ Backward compatible dengan old storage
- ✅ Works di semua modern browsers
- ✅ Smooth UX dengan loading states
- ⚠️ Requires localStorage enabled
- ⚠️ Not working in Incognito mode
