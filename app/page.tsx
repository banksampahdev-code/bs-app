'use client';

import { useEffect, useState } from 'react';
import { Trash2, Recycle, Coins, TrendingUp, Users, Award, Leaf, Download, Zap } from 'lucide-react';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import { useAuthStore } from '@/lib/store/authStore';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function Home() {
  const { user, _hasHydrated } = useAuthStore();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Auto-redirect ke dashboard jika sudah login
  useEffect(() => {
    // Tunggu hydration selesai
    if (!_hasHydrated) {
      return;
    }

    // Jika user sudah login, redirect ke dashboard
    if (user) {
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
        console.log('✅ User detected, redirecting to dashboard...');
      }
      window.location.href = '/dashboard';
      return;
    }

    // User belum login, tampilkan landing page
    setIsChecking(false);
  }, [user, _hasHydrated]);

  useEffect(() => {
    // Check if app is not already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallButton(false);
      return;
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      setShowInstallButton(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallPWA = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }

    setDeferredPrompt(null);
    setShowInstallButton(false);
  };

  // Show loading saat checking auth
  if (!_hasHydrated || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* PWA Install Notification */}
      <PWAInstallPrompt />

      {/* Header/Navbar */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Bank Sampah</h1>
                <p className="text-xs text-gray-600">Sampah Jadi Cuan</p>
              </div>
            </div>
            <div className="flex gap-3">
              <a
                href="/login"
                className="px-6 py-2 text-green-600 border-2 border-green-600 rounded-lg hover:bg-green-50 transition-colors font-medium"
              >
                Masuk
              </a>
              <a
                href="/register"
                className="hidden sm:block px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Daftar
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-block px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium mb-6">
              ♻️ Kelola Sampah, Raih Keuntungan
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Ubah Sampahmu Menjadi <span className="text-green-600">Rupiah</span>
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Bergabunglah dengan Bank Sampah dan mulai mendapatkan penghasilan dari sampah yang dapat didaur ulang.
              Bersama kita ciptakan lingkungan yang lebih bersih dan hijau.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-lg shadow-lg"
              >
                <Users className="w-5 h-5" />
                Daftar Sekarang
              </a>
              {showInstallButton && (
                <button
                  onClick={handleInstallPWA}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg shadow-lg"
                >
                  <Download className="w-5 h-5" />
                  Install Bank Sampah
                </button>
              )}
            </div>
          </div>

          {/* Hero Image/Illustration */}
          <div className="relative">
            <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-2xl p-12 shadow-2xl">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <Recycle className="w-12 h-12 text-green-600 mb-3" />
                  <p className="text-2xl font-bold text-gray-900">2,500+</p>
                  <p className="text-sm text-gray-600">Member Aktif</p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <Coins className="w-12 h-12 text-yellow-600 mb-3" />
                  <p className="text-2xl font-bold text-gray-900">50Jt+</p>
                  <p className="text-sm text-gray-600">Total Saldo</p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <TrendingUp className="w-12 h-12 text-blue-600 mb-3" />
                  <p className="text-2xl font-bold text-gray-900">10Ton+</p>
                  <p className="text-sm text-gray-600">Sampah Terkumpul</p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <Award className="w-12 h-12 text-purple-600 mb-3" />
                  <p className="text-2xl font-bold text-gray-900">100%</p>
                  <p className="text-sm text-gray-600">Terpercaya</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Mengapa Memilih Bank Sampah?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Solusi modern untuk pengelolaan sampah dengan sistem yang transparan dan menguntungkan
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Coins className="w-8 h-8 text-green-600" />,
                title: 'Dapat Penghasilan',
                description: 'Tukar sampah daur ulang dengan uang tunai langsung ke rekening Anda'
              },
              {
                icon: <Zap className="w-8 h-8 text-blue-600" />,
                title: 'Mudah & Praktis',
                description: 'Kelola setoran sampah kapan saja melalui aplikasi web'
              },
              {
                icon: <Leaf className="w-8 h-8 text-green-600" />,
                title: 'Ramah Lingkungan',
                description: 'Berkontribusi nyata untuk lingkungan yang lebih bersih'
              },
              {
                icon: <TrendingUp className="w-8 h-8 text-purple-600" />,
                title: 'Transparan',
                description: 'Lihat riwayat transaksi dan saldo secara real-time'
              }
            ].map((feature, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center mb-4 shadow">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 lg:py-24 bg-gradient-to-b from-white to-green-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Cara Kerja
            </h2>
            <p className="text-lg text-gray-600">
              Mudah dan sederhana, hanya 3 langkah
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Daftar & Dapatkan QR Code',
                description: 'Daftar gratis dan dapatkan QR code unik untuk identifikasi'
              },
              {
                step: '2',
                title: 'Setor Sampah',
                description: 'Bawa sampah daur ulang ke bank sampah atau request pick-up'
              },
              {
                step: '3',
                title: 'Terima Pembayaran',
                description: 'Saldo masuk otomatis dan bisa dicairkan kapan saja'
              }
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mb-6 mx-auto">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">{item.title}</h3>
                  <p className="text-gray-600 text-center">{item.description}</p>
                </div>
                {index < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <div className="w-8 h-0.5 bg-green-300"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-green-600 to-green-700 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Siap Untuk Memulai?
          </h2>
          <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
            Bergabunglah dengan ribuan member lainnya dan mulai dapatkan penghasilan dari sampah Anda hari ini!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-green-600 rounded-lg hover:bg-green-50 transition-colors font-semibold text-lg shadow-lg"
            >
              <Users className="w-5 h-5" />
              Daftar Gratis
            </a>
            {showInstallButton && (
              <button
                onClick={handleInstallPWA}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg shadow-lg"
              >
                <Download className="w-5 h-5" />
                Install Bank Sampah
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold">Bank Sampah</h3>
                  <p className="text-xs">Sampah Jadi Cuan</p>
                </div>
              </div>
              <p className="text-sm">
                Platform modern untuk pengelolaan sampah yang transparan dan menguntungkan.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Menu</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="/login" className="hover:text-green-400 transition-colors">Masuk</a></li>
                <li><a href="/register" className="hover:text-green-400 transition-colors">Daftar</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Hubungi Kami</h4>
              <p className="text-sm">
                Punya pertanyaan? Hubungi Customer Service kami untuk bantuan lebih lanjut.
              </p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2025 Bank Sampah. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
