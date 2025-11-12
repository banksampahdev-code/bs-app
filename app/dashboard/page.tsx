'use client';

import { useAuthStore } from '@/lib/store/authStore';
import { useEffect, useState } from 'react';
import { clearAllCache } from '@/lib/cache-utils';

interface MenuItem {
  title: string;
  icon: string;
  href: string;
  color: string;
}

interface DashboardStats {
  // Pengguna stats
  totalSetoran: number;
  pendingValidation: number;
  saldoTersedia: number;
  // Admin & Pengelola stats
  totalMember: number; // Hanya untuk pengguna biasa
  pengajuanPencairan: number; // Pengajuan pencairan pending (untuk admin/pengelola)
  totalSetoranAll: number;
  totalPencairan: number;
  setoranHariIni: number;
}

interface Artikel {
  id: string;
  judul: string;
  konten: string;
  created_at: string;
}

export default function DashboardPage() {
  const { user, token, logout, _hasHydrated, setAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [latestArtikel, setLatestArtikel] = useState<Artikel | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [csWhatsapp, setCsWhatsapp] = useState('');
  const [stats, setStats] = useState<DashboardStats>({
    totalSetoran: 0,
    pendingValidation: 0,
    saldoTersedia: 0,
    totalMember: 0,
    pengajuanPencairan: 0,
    totalSetoranAll: 0,
    totalPencairan: 0,
    setoranHariIni: 0
  });

  const fetchUserData = async () => {
    if (!user || !token) return;

    try {
      // Refresh user data untuk saldo terbaru
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        // Update store dengan data terbaru
        if (userData.user) {
          setAuth(userData.user, token);
          setStats(prev => ({ ...prev, saldoTersedia: userData.user.saldo || 0 }));
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchStats = async () => {
    if (!user || !token) return;

    try {
      const response = await fetch('/api/setoran/list', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const setorans = await response.json();
        const total = setorans.filter((s: any) => s.status === 'validated').length;
        const pending = setorans.filter((s: any) => s.status === 'pending').length;

        setStats(prev => ({
          ...prev,
          totalSetoran: total,
          pendingValidation: pending
        }));
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchLatestArtikel = async () => {
    if (!user || !token) return;

    try {
      const response = await fetch('/api/artikel/list?limit=1&offset=0', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        const artikels = result.data || [];
        if (artikels.length > 0) {
          setLatestArtikel(artikels[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching latest artikel:', error);
    }
  };

  // Manual refresh function
  const handleManualRefresh = async () => {
    setIsRefreshing(true);

    // Reset stats to 0 first to show fresh data
    setStats({
      totalSetoran: 0,
      pendingValidation: 0,
      saldoTersedia: 0,
      totalMember: 0,
      pengajuanPencairan: 0,
      totalSetoranAll: 0,
      totalPencairan: 0,
      setoranHariIni: 0
    });

    try {
      if (user?.role === 'pengguna') {
        await Promise.all([fetchUserData(), fetchStats(), fetchLatestArtikel()]);
      } else if (user?.role === 'admin' || user?.role === 'pengelola') {
        await fetchAdminPengelolaStats();
      }
    } catch (error) {
      console.error('Manual refresh error:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchAdminPengelolaStats = async () => {
    if (!user || !token) return;
    if (user.role !== 'admin' && user.role !== 'pengelola') return;

    // Reset stats ke 0 sebelum fetch untuk avoid stale data
    setStats({
      totalSetoran: 0,
      pendingValidation: 0,
      saldoTersedia: 0,
      totalMember: 0,
      pengajuanPencairan: 0,
      totalSetoranAll: 0,
      totalPencairan: 0,
      setoranHariIni: 0
    });

    try {
      // Fetch total members
      const memberResponse = await fetch('/api/member/list', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Fetch all setoran
      const setoranResponse = await fetch('/api/setoran/list', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Fetch pencairan data
      const pencairanResponse = await fetch('/api/pencairan/list', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (memberResponse.ok) {
        const members = await memberResponse.json();
        // Filter: hanya hitung role 'pengguna' saja (exclude admin dan pengelola)
        const actualMembers = members.filter((m: any) => m.role === 'pengguna');
        setStats(prev => ({ ...prev, totalMember: actualMembers.length }));
      }

      if (setoranResponse.ok) {
        const setorans = await setoranResponse.json();
        const totalValidated = setorans.filter((s: any) => s.status === 'validated').length;
        const pending = setorans.filter((s: any) => s.status === 'pending').length;

        // Setoran hari ini
        const today = new Date().toISOString().split('T')[0];
        const setoranToday = setorans.filter((s: any) => {
          const setoranDate = new Date(s.tanggal_setor).toISOString().split('T')[0];
          return setoranDate === today;
        }).length;

        setStats(prev => ({
          ...prev,
          totalSetoranAll: totalValidated,
          pendingValidation: pending,
          setoranHariIni: setoranToday
        }));
      }

      if (pencairanResponse.ok) {
        const pencairans = await pencairanResponse.json();
        const totalApproved = pencairans
          .filter((p: any) => p.status === 'approved')
          .reduce((sum: number, p: any) => sum + parseFloat(p.nominal), 0);

        // Hitung pengajuan pencairan yang pending
        const pengajuanPending = pencairans.filter((p: any) => p.status === 'pending').length;

        setStats(prev => ({
          ...prev,
          totalPencairan: totalApproved,
          pengajuanPencairan: pengajuanPending
        }));
      }
    } catch (error) {
      console.error('Error fetching admin/pengelola stats:', error);
    }
  };

  const fetchSettings = async () => {
    if (!token) return;

    try {
      const response = await fetch('/api/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCsWhatsapp(data.cs_whatsapp_number?.value || '');
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
  };

  useEffect(() => {
    // Tunggu hingga store selesai hydrate dari localStorage
    if (!_hasHydrated) {
      return;
    }

    // CRITICAL: Clear browser cache saat dashboard load
    clearAllCache().catch(err => console.error('Cache clear error:', err));

    // Setelah hydrate selesai, cek apakah ada user
    if (!user) {
      console.log('No user found after hydration, redirecting to login');
      window.location.href = '/login';
    } else {
      console.log('User authenticated:', user.nama_lengkap);

      // Fetch settings for all users
      fetchSettings();

      if (user.role === 'pengguna') {
        fetchUserData();
        fetchStats();
        fetchLatestArtikel();
      } else if (user.role === 'admin' || user.role === 'pengelola') {
        fetchAdminPengelolaStats();
      }

      setIsLoading(false);
    }
  }, [user, _hasHydrated]);

  // Auto-refresh data setiap 10 detik untuk real-time updates
  useEffect(() => {
    if (!user || !token || !_hasHydrated) return;

    const refreshInterval = setInterval(() => {
      if (user.role === 'pengguna') {
        fetchUserData();
        fetchStats();
      } else if (user.role === 'admin' || user.role === 'pengelola') {
        fetchAdminPengelolaStats();
      }
    }, 10000); // Refresh setiap 10 detik

    return () => clearInterval(refreshInterval);
  }, [user, token, _hasHydrated]);

  // DISABLED SEMENTARA: Supabase Realtime (menyebabkan error)
  // Gunakan polling saja dulu dengan interval yang lebih cepat
  // TODO: Enable kembali setelah fix dependency issues
  /*
  useEffect(() => {
    if (!user || !_hasHydrated || !token) return;
    // ... Supabase Realtime code ...
  }, [user?.id, user?.role, _hasHydrated, token]);
  */

  if (!_hasHydrated || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Menu berdasarkan role
  const getMenuItems = (): MenuItem[] => {
    switch (user.role) {
      case 'pengguna': // Backend tetap 'pengguna'
        return [
          { title: 'Setor Sampah', icon: '🗑️', href: '/dashboard/setor-sampah', color: 'green' },
          { title: 'Riwayat', icon: '📋', href: '/dashboard/riwayat-sampah', color: 'blue' },
          { title: 'Saldo', icon: '💰', href: '/dashboard/saldo', color: 'yellow' },
          { title: 'Pencairan', icon: '💸', href: '/dashboard/pencairan', color: 'purple' },
          { title: 'Edukasi', icon: '📚', href: '/dashboard/edukasi', color: 'indigo' },
        ];

      case 'pengelola':
        return [
          { title: 'Scan QR', icon: '📱', href: '/dashboard/scan', color: 'blue' },
          { title: 'Antrian Sampah', icon: '⏳', href: '/dashboard/antrian-sampah', color: 'orange' },
          { title: 'Riwayat Sampah', icon: '📋', href: '/dashboard/riwayat-sampah', color: 'green' },
          { title: 'Pencairan', icon: '💸', href: '/dashboard/pencairan', color: 'purple' },
          { title: 'Member', icon: '👥', href: '/dashboard/member', color: 'teal' },
          { title: 'Laporan', icon: '📊', href: '/dashboard/laporan', color: 'indigo' },
        ];

      case 'admin':
        return [
          { title: 'Scan QR', icon: '📱', href: '/dashboard/scan', color: 'blue' },
          { title: 'Antrian Sampah', icon: '⏳', href: '/dashboard/antrian-sampah', color: 'orange' },
          { title: 'Riwayat Sampah', icon: '📋', href: '/dashboard/riwayat-sampah', color: 'green' },
          { title: 'Artikel', icon: '📝', href: '/dashboard/artikel', color: 'yellow' },
          { title: 'Pencairan', icon: '💸', href: '/dashboard/pencairan', color: 'purple' },
          { title: 'Member', icon: '👥', href: '/dashboard/member', color: 'teal' },
          { title: 'Laporan', icon: '📊', href: '/dashboard/laporan', color: 'indigo' },
        ];

      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  // Generate kode unik 3 digit dari user ID
  const getUserCode = () => {
    if (!user) return '';
    // Ambil 3 karakter terakhir dari ID dan convert ke uppercase
    return user.id.slice(-3).toUpperCase();
  };

  return (
    <div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-4 sm:p-6 lg:p-8 mb-8 text-white">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold break-words">Halo, {user.nama_lengkap}! 👋</h2>
                <button
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Refresh data"
                >
                  <svg
                    className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {isRefreshing ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
              <p className="text-green-100 mb-1 text-sm sm:text-base break-all">{user.email}</p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <div className="inline-block px-3 py-1 bg-white text-gray-800 rounded-full text-xs sm:text-sm font-medium">
                  {user.role === 'admin' && 'Admin'}
                  {user.role === 'pengelola' && 'Pengelola'}
                  {user.role === 'pengguna' && 'Member'}
                </div>
                {user.role === 'pengguna' && (
                  <>
                    <div className="inline-block px-3 py-1 bg-yellow-400 text-gray-900 rounded-full text-xs sm:text-sm font-bold">
                      ID: {getUserCode()}
                    </div>
                    <button
                      onClick={() => setShowQRModal(true)}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-white text-green-600 rounded-full text-xs sm:text-sm font-medium hover:bg-green-50 transition-colors"
                    >
                      📱 Lihat QR
                    </button>
                  </>
                )}
              </div>
            </div>
            {user.role === 'pengguna' && (
              <div className="text-left sm:text-right w-full sm:w-auto">
                <p className="text-green-100 text-xs sm:text-sm mb-1">Saldo Anda</p>
                <p className="text-2xl sm:text-3xl lg:text-4xl font-bold break-words">
                  Rp {stats.saldoTersedia.toLocaleString('id-ID')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Latest Article - hanya untuk pengguna */}
        {user.role === 'pengguna' && latestArtikel && (
          <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4 mb-6">
            <p className="text-blue-800 font-medium">
              <span className="font-semibold">Artikel Terbaru:</span>{' '}
              <a
                href={`/dashboard/edukasi/${latestArtikel.id}`}
                className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
              >
                {latestArtikel.judul}
              </a>
            </p>
          </div>
        )}

        {/* Stats Cards - berbeda per role */}
        <div className={`grid grid-cols-1 ${user.role === 'admin' ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-6 mb-8`}>
          {user.role === 'pengguna' && (
            <>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600 mb-1">Total Setoran Saya</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalSetoran}</p>
                <p className="text-sm text-green-600 mt-1">Tervalidasi</p>
                <a
                  href="/dashboard/riwayat-sampah"
                  className="inline-flex items-center gap-1 mt-3 text-sm text-green-600 hover:text-green-700 font-medium"
                >
                  Lihat
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600 mb-1">Menunggu Validasi</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pendingValidation}</p>
                <p className="text-sm text-yellow-600 mt-1">Perlu review</p>
                <a
                  href="/dashboard/riwayat-sampah"
                  className="inline-flex items-center gap-1 mt-3 text-sm text-yellow-600 hover:text-yellow-700 font-medium"
                >
                  Lihat
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600 mb-1">Saldo Tersedia</p>
                <p className="text-3xl font-bold text-green-600">
                  Rp {stats.saldoTersedia.toLocaleString('id-ID')}
                </p>
                <p className="text-sm text-green-600 mt-1">Siap dicairkan</p>
                <a
                  href="/dashboard/saldo"
                  className="inline-flex items-center gap-1 mt-3 text-sm text-green-600 hover:text-green-700 font-medium"
                >
                  Lihat
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </>
          )}

          {user.role === 'pengelola' && (
            <>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600 mb-1">Pengajuan Pencairan</p>
                <p className="text-3xl font-bold text-purple-600">{stats.pengajuanPencairan}</p>
                <p className="text-sm text-purple-600 mt-1">Menunggu persetujuan</p>
                <a
                  href="/dashboard/pencairan"
                  className="inline-flex items-center gap-1 mt-3 text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                  Lihat
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600 mb-1">Total Antrian Sampah</p>
                <p className="text-3xl font-bold text-orange-600">{stats.pendingValidation}</p>
                <p className="text-sm text-orange-600 mt-1">Belum tervalidasi</p>
                <a
                  href="/dashboard/antrian-sampah"
                  className="inline-flex items-center gap-1 mt-3 text-sm text-orange-600 hover:text-orange-700 font-medium"
                >
                  Lihat
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600 mb-1">Setoran Hari Ini</p>
                <p className="text-3xl font-bold text-green-600">{stats.setoranHariIni}</p>
                <p className="text-sm text-green-600 mt-1">Transaksi</p>
                <a
                  href="/dashboard/riwayat-sampah"
                  className="inline-flex items-center gap-1 mt-3 text-sm text-green-600 hover:text-green-700 font-medium"
                >
                  Lihat
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </>
          )}

          {user.role === 'admin' && (
            <>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600 mb-1">Pengajuan Pencairan</p>
                <p className="text-3xl font-bold text-purple-600">{stats.pengajuanPencairan}</p>
                <p className="text-sm text-purple-600 mt-1">Menunggu persetujuan</p>
                <a
                  href="/dashboard/pencairan"
                  className="inline-flex items-center gap-1 mt-3 text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                  Lihat
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600 mb-1">Total Antrian Sampah</p>
                <p className="text-3xl font-bold text-orange-600">{stats.pendingValidation}</p>
                <p className="text-sm text-orange-600 mt-1">Belum tervalidasi</p>
                <a
                  href="/dashboard/antrian-sampah"
                  className="inline-flex items-center gap-1 mt-3 text-sm text-orange-600 hover:text-orange-700 font-medium"
                >
                  Lihat
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600 mb-1">Total Setoran</p>
                <p className="text-3xl font-bold text-green-600">{stats.totalSetoranAll}</p>
                <p className="text-sm text-green-600 mt-1">Tervalidasi</p>
                <a
                  href="/dashboard/riwayat-sampah"
                  className="inline-flex items-center gap-1 mt-3 text-sm text-green-600 hover:text-green-700 font-medium"
                >
                  Lihat
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600 mb-1">Total Pencairan</p>
                <p className="text-3xl font-bold text-blue-600">
                  Rp {stats.totalPencairan.toLocaleString('id-ID')}
                </p>
                <p className="text-sm text-blue-600 mt-1">Disetujui</p>
                <a
                  href="/dashboard/pencairan"
                  className="inline-flex items-center gap-1 mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Lihat
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            Menu Cepat {user.role === 'pengguna' ? '- Member' : user.role === 'pengelola' ? '- Pengelola' : '- Admin'}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {menuItems.map((menu, index) => {
              const colorClasses = {
                green: 'border-green-200 hover:bg-green-50 hover:border-green-500 bg-green-100',
                blue: 'border-blue-200 hover:bg-blue-50 hover:border-blue-500 bg-blue-100',
                yellow: 'border-yellow-200 hover:bg-yellow-50 hover:border-yellow-500 bg-yellow-100',
                purple: 'border-purple-200 hover:bg-purple-50 hover:border-purple-500 bg-purple-100',
                indigo: 'border-indigo-200 hover:bg-indigo-50 hover:border-indigo-500 bg-indigo-100',
                orange: 'border-orange-200 hover:bg-orange-50 hover:border-orange-500 bg-orange-100',
                teal: 'border-teal-200 hover:bg-teal-50 hover:border-teal-500 bg-teal-100',
              };

              const bgColor = colorClasses[menu.color as keyof typeof colorClasses] || colorClasses.green;
              const [borderColor, hoverBg, hoverBorder, iconBg] = bgColor.split(' ');

              return (
                <button
                  key={index}
                  onClick={() => window.location.href = menu.href}
                  className={`p-6 border-2 ${borderColor} ${hoverBg} ${hoverBorder} rounded-lg transition-all text-center`}
                >
                  <div className={`w-12 h-12 ${iconBg} rounded-lg flex items-center justify-center mx-auto mb-3`}>
                    <span className="text-2xl">{menu.icon}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{menu.title}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Hubungi CS Button */}
        {csWhatsapp && (
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white mt-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-xl font-bold mb-2">Butuh Bantuan?</h3>
                <p className="text-green-100">Tim Customer Service kami siap membantu Anda</p>
              </div>
              <a
                href={`https://wa.me/${csWhatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-green-600 rounded-lg hover:bg-green-50 transition-colors font-medium shadow-md"
              >
                <span className="text-xl">💬</span>
                <span>Hubungi CS</span>
              </a>
            </div>
          </div>
        )}

        {/* Modal QR Code */}
        {showQRModal && user.role === 'pengguna' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">QR Code Anda</h3>
                <p className="text-gray-600 mb-6">Tunjukkan QR ini saat melakukan setoran sampah</p>

                <div className="bg-gray-50 rounded-lg p-6 mb-4">
                  {user.qr_code ? (
                    <img
                      src={user.qr_code}
                      alt="QR Code"
                      className="w-64 h-64 mx-auto"
                    />
                  ) : (
                    <div className="w-64 h-64 mx-auto flex items-center justify-center bg-gray-200 rounded-lg">
                      <p className="text-gray-500">QR Code tidak tersedia</p>
                    </div>
                  )}
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-yellow-800 mb-1">Kode Unik Anda</p>
                  <p className="text-3xl font-bold text-yellow-900">{getUserCode()}</p>
                </div>

                <button
                  onClick={() => setShowQRModal(false)}
                  className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}