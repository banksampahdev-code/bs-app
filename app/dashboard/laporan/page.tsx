'use client';

import { useState, useEffect } from 'react';
import { laporanService } from '@/lib/api';
import { FileText, Download, TrendingUp, Users, Wallet, BarChart3 } from 'lucide-react';
import { useAuthStore } from '@/lib/store/authStore';

interface Stats {
  totalSetoran: number;
  totalPencairan: number;
  totalMember: number;
  setoranBulanIni: number;
  pencairanBulanIni: number;
  totalNominalSetoran: number;
  totalNominalPencairan: number;
}

export default function LaporanPage() {
  const { token } = useAuthStore();
  const [type, setType] = useState<'setoran' | 'pencairan'>('setoran');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [stats, setStats] = useState<Stats>({
    totalSetoran: 0,
    totalPencairan: 0,
    totalMember: 0,
    setoranBulanIni: 0,
    pencairanBulanIni: 0,
    totalNominalSetoran: 0,
    totalNominalPencairan: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    if (!token) return;

    try {
      // Fetch members
      const memberResponse = await fetch('/api/member/list', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Fetch setoran
      const setoranResponse = await fetch('/api/setoran/list', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Fetch pencairan
      const pencairanResponse = await fetch('/api/pencairan/list', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (memberResponse.ok) {
        const members = await memberResponse.json();
        setStats(prev => ({ ...prev, totalMember: members.length }));
      }

      if (setoranResponse.ok) {
        const setorans = await setoranResponse.json();
        const validated = setorans.filter((s: any) => s.status === 'validated');

        // Get current month's data
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const setoranThisMonth = validated.filter((s: any) => {
          const date = new Date(s.tanggal_validasi);
          return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        });

        const totalNominal = validated.reduce((sum: number, s: any) =>
          sum + parseFloat(s.total_harga || 0), 0
        );

        setStats(prev => ({
          ...prev,
          totalSetoran: validated.length,
          setoranBulanIni: setoranThisMonth.length,
          totalNominalSetoran: totalNominal
        }));
      }

      if (pencairanResponse.ok) {
        const pencairans = await pencairanResponse.json();
        const approved = pencairans.filter((p: any) => p.status === 'approved');

        // Get current month's data
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const pencairanThisMonth = approved.filter((p: any) => {
          const date = new Date(p.tanggal_pencairan);
          return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        });

        const totalNominal = approved.reduce((sum: number, p: any) =>
          sum + parseFloat(p.nominal || 0), 0
        );

        setStats(prev => ({
          ...prev,
          totalPencairan: approved.length,
          pencairanBulanIni: pencairanThisMonth.length,
          totalNominalPencairan: totalNominal
        }));
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const url = laporanService.export(type, startDate, endDate);

    // Create temporary link and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = `laporan-${type}-${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const maxValue = Math.max(stats.totalNominalSetoran, stats.totalNominalPencairan);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
          <BarChart3 className="w-6 h-6 text-yellow-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Laporan & Statistik</h1>
          <p className="text-gray-600">Ringkasan data dan export laporan</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 opacity-80" />
            <div className="text-right">
              <p className="text-3xl font-bold">{stats.totalMember}</p>
            </div>
          </div>
          <p className="text-blue-100 text-sm">Total Member</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-8 h-8 opacity-80" />
            <div className="text-right">
              <p className="text-3xl font-bold">{stats.totalSetoran}</p>
            </div>
          </div>
          <p className="text-green-100 text-sm">Total Setoran</p>
          <p className="text-green-100 text-xs mt-1">{stats.setoranBulanIni} bulan ini</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Wallet className="w-8 h-8 opacity-80" />
            <div className="text-right">
              <p className="text-3xl font-bold">{stats.totalPencairan}</p>
            </div>
          </div>
          <p className="text-purple-100 text-sm">Total Pencairan</p>
          <p className="text-purple-100 text-xs mt-1">{stats.pencairanBulanIni} bulan ini</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <FileText className="w-8 h-8 opacity-80" />
            <div className="text-right">
              <p className="text-2xl font-bold">
                Rp {((stats.totalNominalSetoran - stats.totalNominalPencairan) / 1000000).toFixed(1)}Jt
              </p>
            </div>
          </div>
          <p className="text-orange-100 text-sm">Saldo Sistem</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Bar Chart - Perbandingan Nominal */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Perbandingan Nominal (Rupiah)</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Total Setoran</span>
                <span className="text-sm font-bold text-green-600">
                  Rp {stats.totalNominalSetoran.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-green-500 h-4 rounded-full transition-all duration-500"
                  style={{ width: `${maxValue > 0 ? (stats.totalNominalSetoran / maxValue) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Total Pencairan</span>
                <span className="text-sm font-bold text-purple-600">
                  Rp {stats.totalNominalPencairan.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-purple-500 h-4 rounded-full transition-all duration-500"
                  style={{ width: `${maxValue > 0 ? (stats.totalNominalPencairan / maxValue) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Selisih</span>
              <span className="text-lg font-bold text-orange-600">
                Rp {(stats.totalNominalSetoran - stats.totalNominalPencairan).toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>

        {/* Pie Chart Alternative - Persentase */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Distribusi Transaksi</h3>
          <div className="flex items-center justify-center mb-6">
            <div className="relative w-48 h-48">
              {/* Simple Pie Chart using conic-gradient */}
              <div
                className="w-full h-full rounded-full"
                style={{
                  background: `conic-gradient(
                    #10b981 0deg ${stats.totalSetoran > 0 ? (stats.totalSetoran / (stats.totalSetoran + stats.totalPencairan)) * 360 : 0}deg,
                    #a855f7 ${stats.totalSetoran > 0 ? (stats.totalSetoran / (stats.totalSetoran + stats.totalPencairan)) * 360 : 0}deg 360deg
                  )`
                }}
              ></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white rounded-full w-32 h-32 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-800">
                      {stats.totalSetoran + stats.totalPencairan}
                    </p>
                    <p className="text-xs text-gray-500">Total</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-sm text-gray-700">Setoran</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-800">{stats.totalSetoran}</p>
                <p className="text-xs text-gray-500">
                  {stats.totalSetoran + stats.totalPencairan > 0
                    ? ((stats.totalSetoran / (stats.totalSetoran + stats.totalPencairan)) * 100).toFixed(1)
                    : 0}%
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-purple-500 rounded"></div>
                <span className="text-sm text-gray-700">Pencairan</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-800">{stats.totalPencairan}</p>
                <p className="text-xs text-gray-500">
                  {stats.totalSetoran + stats.totalPencairan > 0
                    ? ((stats.totalPencairan / (stats.totalSetoran + stats.totalPencairan)) * 100).toFixed(1)
                    : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Export Section */}
      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Export Laporan</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jenis Laporan
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="setoran">Laporan Setoran Sampah</option>
              <option value="pencairan">Laporan Pencairan Saldo</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Mulai
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Akhir
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Info:</strong> Jika tanggal tidak diisi, semua data akan diexport.
            </p>
          </div>

          <button
            onClick={handleExport}
            className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            <Download className="w-5 h-5" />
            Export ke Excel
          </button>
        </div>
      </div>
    </div>
  );
}