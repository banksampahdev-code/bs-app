'use client';

import { useState, useEffect } from 'react';
import { laporanService } from '@/lib/api';
import { FileText, Download, TrendingUp, Users, Wallet, BarChart3, Award, TrendingDown, Trash2, Weight } from 'lucide-react';
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

interface TopMember {
  user_id: string;
  nama_lengkap: string;
  email: string;
  total_pendapatan: number;
  jumlah_transaksi: number;
}

interface JenisSampah {
  jenis: string;
  total_berat: number;
  jumlah_transaksi: number;
  total_nominal: number;
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
  const [exporting, setExporting] = useState(false);
  const [topMembers, setTopMembers] = useState<TopMember[]>([]);
  const [jenisSampahList, setJenisSampahList] = useState<JenisSampah[]>([]);
  const [totalBeratKeseluruhan, setTotalBeratKeseluruhan] = useState(0);

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

        // Calculate top 10 members based on last month's income
        const memberEarnings = new Map<string, { nama_lengkap: string; email: string; total: number; count: number }>();

        setoranThisMonth.forEach((s: any) => {
          if (s.user_id && s.users) {
            const existing = memberEarnings.get(s.user_id);
            const amount = parseFloat(s.total_harga || 0);

            if (existing) {
              existing.total += amount;
              existing.count += 1;
            } else {
              memberEarnings.set(s.user_id, {
                nama_lengkap: s.users.nama_lengkap || 'Unknown',
                email: s.users.email || '',
                total: amount,
                count: 1
              });
            }
          }
        });

        // Convert to array and sort by total earnings
        const topMembersList: TopMember[] = Array.from(memberEarnings.entries())
          .map(([user_id, data]) => ({
            user_id,
            nama_lengkap: data.nama_lengkap,
            email: data.email,
            total_pendapatan: data.total,
            jumlah_transaksi: data.count
          }))
          .sort((a, b) => b.total_pendapatan - a.total_pendapatan)
          .slice(0, 10);

        setTopMembers(topMembersList);

        // Calculate jenis sampah statistics from all validated data
        const jenisSampahMap = new Map<string, { total_berat: number; count: number; total_nominal: number }>();
        let totalBerat = 0;

        validated.forEach((s: any) => {
          if (s.jenis_sampah) {
            const jenis = s.jenis_sampah;
            const berat = parseFloat(s.berat_sampah || 0);
            const nominal = parseFloat(s.total_harga || 0);

            totalBerat += berat;

            const existing = jenisSampahMap.get(jenis);
            if (existing) {
              existing.total_berat += berat;
              existing.count += 1;
              existing.total_nominal += nominal;
            } else {
              jenisSampahMap.set(jenis, {
                total_berat: berat,
                count: 1,
                total_nominal: nominal
              });
            }
          }
        });

        // Convert to array and sort by total berat
        const jenisSampahArray: JenisSampah[] = Array.from(jenisSampahMap.entries())
          .map(([jenis, data]) => ({
            jenis,
            total_berat: data.total_berat,
            jumlah_transaksi: data.count,
            total_nominal: data.total_nominal
          }))
          .sort((a, b) => b.total_berat - a.total_berat);

        setJenisSampahList(jenisSampahArray);
        setTotalBeratKeseluruhan(totalBerat);
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

  const handleExport = async () => {
    if (!token) {
      alert('Anda harus login terlebih dahulu');
      return;
    }

    setExporting(true);

    try {
      // Build URL dengan parameters
      const params = new URLSearchParams({ type });
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const url = `/api/laporan/export?${params.toString()}`;

      // Fetch dengan Authorization header
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Gagal mengexport laporan');
      }

      // Get blob dari response
      const blob = await response.blob();

      // Create object URL dari blob
      const blobUrl = window.URL.createObjectURL(blob);

      // Create temporary link dan trigger download
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `laporan-${type}-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      alert('Laporan berhasil diexport!');
    } catch (error: any) {
      console.error('Export error:', error);
      alert(error.message || 'Gagal mengexport laporan');
    } finally {
      setExporting(false);
    }
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
                Rp {(stats.totalNominalSetoran - stats.totalNominalPencairan).toLocaleString('id-ID')}
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

      {/* Jenis Sampah Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Trash2 className="w-6 h-6 text-green-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Statistik Jenis Sampah</h2>
              <p className="text-sm text-gray-600">Data sampah yang sudah divalidasi</p>
            </div>
          </div>
          <div className="bg-green-100 rounded-lg px-4 py-3">
            <div className="flex items-center gap-2">
              <Weight className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-xs text-green-700 font-medium">Total Berat Keseluruhan</p>
                <p className="text-xl font-bold text-green-600">
                  {totalBeratKeseluruhan.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Kg
                </p>
              </div>
            </div>
          </div>
        </div>

        {jenisSampahList.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Jenis Sampah
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Total Berat (Kg)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Jumlah Transaksi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Total Nominal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Persentase Berat
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {jenisSampahList.map((item, index) => {
                  const persentase = totalBeratKeseluruhan > 0
                    ? (item.total_berat / totalBeratKeseluruhan) * 100
                    : 0;

                  return (
                    <tr key={item.jenis} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 font-bold text-sm">{index + 1}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Trash2 className="w-5 h-5 text-gray-400 mr-2" />
                          <p className="text-sm font-medium text-gray-900 capitalize">
                            {item.jenis}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                        {item.total_berat.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Kg
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {item.jumlah_transaksi} transaksi
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Rp {item.total_nominal.toLocaleString('id-ID')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden" style={{ minWidth: '100px' }}>
                            <div
                              className="bg-green-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${persentase}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-700">
                            {persentase.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Trash2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">Belum ada data setoran sampah yang divalidasi</p>
          </div>
        )}
      </div>

      {/* Top 10 Members Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <Award className="w-6 h-6 text-yellow-600" />
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Top 10 Member Bulan Ini</h2>
            <p className="text-sm text-gray-600">Member dengan pendapatan saldo terbanyak dalam 1 bulan terakhir</p>
          </div>
        </div>

        {topMembers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Nama Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Jumlah Transaksi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Total Pendapatan
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topMembers.map((member, index) => (
                  <tr key={member.user_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {index === 0 && (
                          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                            <span className="text-yellow-600 font-bold text-sm">🥇</span>
                          </div>
                        )}
                        {index === 1 && (
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="text-gray-600 font-bold text-sm">🥈</span>
                          </div>
                        )}
                        {index === 2 && (
                          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                            <span className="text-orange-600 font-bold text-sm">🥉</span>
                          </div>
                        )}
                        {index > 2 && (
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-bold text-sm">{index + 1}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-indigo-600 font-medium">
                            {member.nama_lengkap.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            {member.nama_lengkap}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {member.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {member.jumlah_transaksi} transaksi
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                      Rp {member.total_pendapatan.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <TrendingDown className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">Belum ada data transaksi bulan ini</p>
          </div>
        )}
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