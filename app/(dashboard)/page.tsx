'use client';

import { useAuthStore } from '@/lib/store/authStore';
import { Trash2, Wallet, Users, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { setoranService } from '@/lib/api';

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const [stats, setStats] = useState({
    totalSetoran: 0,
    setoranPending: 0,
    totalSaldo: 0,
    setoranBulanIni: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await setoranService.list();
      
      const totalSetoran = data.length;
      const setoranPending = data.filter((s: any) => s.status === 'pending').length;
      const setoranBulanIni = data.filter((s: any) => {
        const date = new Date(s.tanggal_setor);
        const now = new Date();
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      }).length;

      setStats({
        totalSetoran,
        setoranPending,
        totalSaldo: user?.saldo || 0,
        setoranBulanIni,
      });
    } catch (error) {
      console.error('Load stats error:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    {
      title: 'Total Setoran',
      value: stats.totalSetoran,
      icon: Trash2,
      color: 'bg-blue-500',
    },
    {
      title: 'Menunggu Validasi',
      value: stats.setoranPending,
      icon: TrendingUp,
      color: 'bg-yellow-500',
    },
    {
      title: 'Saldo',
      value: `Rp ${stats.totalSaldo.toLocaleString('id-ID')}`,
      icon: Wallet,
      color: 'bg-green-500',
    },
    {
      title: 'Setoran Bulan Ini',
      value: stats.setoranBulanIni,
      icon: Users,
      color: 'bg-purple-500',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                </div>
                <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      {user?.role === 'pengguna' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Aksi Cepat</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/dashboard/setor-sampah"
              className="p-4 border-2 border-green-500 rounded-lg hover:bg-green-50 transition-colors text-center"
            >
              <Trash2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="font-medium text-gray-800">Setor Sampah</p>
            </a>
            <a
              href="/dashboard/riwayat-sampah"
              className="p-4 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              <TrendingUp className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="font-medium text-gray-800">Riwayat</p>
            </a>
            <a
              href="/dashboard/saldo"
              className="p-4 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              <Wallet className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="font-medium text-gray-800">Saldo</p>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}