# Setup PWA Bank Sampah App

## ✅ Yang Sudah Dikonfigurasi

1. **Manifest.json** - Konfigurasi PWA di `/public/manifest.json`
2. **Service Worker** - Offline support di `/public/sw.js`
3. **Offline Page** - Halaman fallback di `/public/offline.html`
4. **PWA Metadata** - Metadata di `app/layout.tsx`
5. **Service Worker Registration** - Auto-register di `app/components/PWARegister.tsx`

## 📱 Langkah-langkah untuk Install PWA di Android

### 1. Generate Icons
Anda perlu membuat icons untuk PWA. Ada 2 cara:

#### Opsi A: Otomatis dengan Script (Recommended)
```bash
# Install sharp untuk image processing
npm install --save-dev sharp

# Siapkan logo (512x512px atau lebih besar)
# Letakkan di: public/logo.png

# Generate semua icon sizes
node scripts/generate-icons.js
```

#### Opsi B: Manual
Buat icon dengan ukuran berikut dan letakkan di folder `public/`:
- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

Anda bisa menggunakan tool online seperti:
- https://realfavicongenerator.net/
- https://www.pwabuilder.com/imageGenerator

### 2. Build dan Deploy Aplikasi

```bash
# Build aplikasi
npm run build

# Test locally
npm start

# Atau deploy ke hosting (Vercel, Netlify, dll)
```

### 3. Test PWA di Android

1. **Buka di Chrome Android**
   - Buka aplikasi di browser Chrome Android
   - Pastikan menggunakan HTTPS (required untuk PWA)

2. **Install PWA**
   - Tap menu (3 titik) di Chrome
   - Pilih "Add to Home screen" atau "Install app"
   - Ikuti instruksi

3. **Test Offline**
   - Buka aplikasi yang sudah di-install
   - Matikan internet
   - Aplikasi seharusnya masih bisa dibuka (menampilkan offline page)

### 4. Validasi PWA

Untuk memastikan PWA setup dengan benar:

1. **Chrome DevTools**
   ```
   - Buka DevTools (F12)
   - Tab "Application"
   - Check "Manifest" - harus ada dan valid
   - Check "Service Workers" - harus registered
   - Tab "Lighthouse"
   - Run PWA audit
   ```

2. **PWA Checklist**
   - ✅ Manifest.json configured
   - ✅ Service worker registered
   - ✅ Icons available
   - ✅ HTTPS enabled (required for production)
   - ✅ Responsive design
   - ✅ Offline fallback

## 🎨 Kustomisasi

### Ubah Warna Tema
Edit `public/manifest.json`:
```json
{
  "theme_color": "#22c55e",  // Warna theme/toolbar
  "background_color": "#ffffff"  // Warna background saat loading
}
```

### Ubah Nama Aplikasi
Edit `public/manifest.json`:
```json
{
  "name": "Bank Sampah App",  // Nama lengkap
  "short_name": "Bank Sampah"  // Nama pendek untuk home screen
}
```

### Cache Strategy
Edit `public/sw.js` untuk mengubah strategi caching:
- Cache-first: Cepat tapi bisa outdated
- Network-first: Selalu fresh tapi butuh internet
- Stale-while-revalidate: Balance antara keduanya

## 🐛 Troubleshooting

### PWA tidak bisa di-install
- Pastikan menggunakan HTTPS
- Check manifest.json valid di DevTools
- Pastikan semua icons tersedia
- Check service worker registered

### Service Worker tidak update
```javascript
// Clear cache dan unregister
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(registration => registration.unregister());
});

// Refresh halaman
```

### Icons tidak muncul
- Check path icons di manifest.json
- Pastikan file icons ada di folder public/
- Clear cache browser

## 📚 Resources

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Manifest Generator](https://www.simicart.com/manifest-generator.html/)
- [PWA Builder](https://www.pwabuilder.com/)
- [Workbox (Advanced SW)](https://developers.google.com/web/tools/workbox)

## 🚀 Next Steps

1. Generate icons
2. Test locally
3. Deploy ke HTTPS hosting
4. Test install di Android
5. Adjust cache strategy sesuai kebutuhan
