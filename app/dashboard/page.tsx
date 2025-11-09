'use client';

import { useAuthStore } from '@/lib/store/authStore';
import { useEffect, useState } from 'react';

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
  totalMember: number;
  totalSetoranAll: number;
  totalPencairan: number;
  setoranHariIni: number;
}

export default function DashboardPage() {
  const { user, token, logout, _hasHydrated, setAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalSetoran: 0,
    pendingValidation: 0,
    saldoTersedia: 0,
    totalMember: 0,
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

  const fetchAdminPengelolaStats = async () => {
    if (!user || !token) return;
    if (user.role !== 'admin' && user.role !== 'pengelola') return;

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
        setStats(prev => ({ ...prev, totalMember: members.length }));
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

        setStats(prev => ({ ...prev, totalPencairan: totalApproved }));
      }
    } catch (error) {
      console.error('Error fetching admin/pengelola stats:', error);
    }
  };

  useEffect(() => {
    // Tunggu hingga store selesai hydrate dari localStorage
    if (!_hasHydrated) {
      return;
    }

    // Setelah hydrate selesai, cek apakah ada user
    if (!user) {
      console.log('No user found after hydration, redirecting to login');
      window.location.href = '/login';
    } else {
      console.log('User authenticated:', user.nama_lengkap);

      if (user.role === 'pengguna') {
        fetchUserData();
        fetchStats();
      } else if (user.role === 'admin' || user.role === 'pengelola') {
        fetchAdminPengelolaStats();
      }

      setIsLoading(false);
    }
  }, [user, _hasHydrated]);

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
          { title: 'Antrian Sampah', icon: '⏳', href: '/dashboard/antrian-sampah', color: 'orange' },
          { title: 'Riwayat Sampah', icon: '📋', href: '/dashboard/riwayat-sampah', color: 'blue' },
          { title: 'Pencairan', icon: '💸', href: '/dashboard/pencairan', color: 'purple' },
          { title: 'Member', icon: '👥', href: '/dashboard/member', color: 'teal' },
          { title: 'Laporan', icon: '📊', href: '/dashboard/laporan', color: 'indigo' },
        ];

      case 'admin':
        return [
          { title: 'Antrian Sampah', icon: '⏳', href: '/dashboard/antrian-sampah', color: 'orange' },
          { title: 'Riwayat Sampah', icon: '📋', href: '/dashboard/riwayat-sampah', color: 'blue' },
          { title: 'Artikel', icon: '📝', href: '/dashboard/artikel', color: 'green' },
          { title: 'Pencairan', icon: '💸', href: '/dashboard/pencairan', color: 'purple' },
          { title: 'Member', icon: '👥', href: '/dashboard/member', color: 'teal' },
          { title: 'Laporan', icon: '📊', href: '/dashboard/laporan', color: 'indigo' },
        ];

      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  return (
    <div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-8 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">Halo, {user.nama_lengkap}! 👋</h2>
              <p className="text-green-100 mb-1">{user.email}</p>
              <div className="inline-block px-3 py-1 bg-white text-gray-800 rounded-full text-sm font-medium mt-2">
                {user.role === 'admin' && 'Admin'}
                {user.role === 'pengelola' && 'Pengelola'}
                {user.role === 'pengguna' && 'Member'}
              </div>
            </div>
            {user.role === 'pengguna' && (
              <div className="text-right">
                <p className="text-green-100 text-sm mb-1">Saldo Anda</p>
                <p className="text-4xl font-bold">
                  Rp {stats.saldoTersedia.toLocaleString('id-ID')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards - berbeda per role */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {user.role === 'pengguna' && (
            <>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600 mb-1">Total Setoran Saya</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalSetoran}</p>
                <p className="text-sm text-green-600 mt-1">Tervalidasi</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600 mb-1">Menunggu Validasi</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pendingValidation}</p>
                <p className="text-sm text-yellow-600 mt-1">Perlu review</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600 mb-1">Saldo Tersedia</p>
                <p className="text-3xl font-bold text-green-600">
                  Rp {stats.saldoTersedia.toLocaleString('id-ID')}
                </p>
                <p className="text-sm text-green-600 mt-1">Siap dicairkan</p>
              </div>
            </>
          )}

          {user.role === 'pengelola' && (
            <>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600 mb-1">Total Member</p>
                <p className="text-3xl font-bold text-blue-600">{stats.totalMember}</p>
                <p className="text-sm text-blue-600 mt-1">Member terdaftar</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600 mb-1">Antrian Validasi</p>
                <p className="text-3xl font-bold text-orange-600">{stats.pendingValidation}</p>
                <p className="text-sm text-orange-600 mt-1">Perlu divalidasi</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600 mb-1">Setoran Hari Ini</p>
                <p className="text-3xl font-bold text-green-600">{stats.setoranHariIni}</p>
                <p className="text-sm text-green-600 mt-1">Transaksi</p>
              </div>
            </>
          )}

          {user.role === 'admin' && (
            <>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600 mb-1">Total Member</p>
                <p className="text-3xl font-bold text-blue-600">{stats.totalMember}</p>
                <p className="text-sm text-blue-600 mt-1">Semua member</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600 mb-1">Total Setoran</p>
                <p className="text-3xl font-bold text-green-600">{stats.totalSetoranAll}</p>
                <p className="text-sm text-green-600 mt-1">Tervalidasi</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600 mb-1">Total Pencairan</p>
                <p className="text-3xl font-bold text-purple-600">
                  Rp {stats.totalPencairan.toLocaleString('id-ID')}
                </p>
                <p className="text-sm text-purple-600 mt-1">Disetujui</p>
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
    </div>
  );
}