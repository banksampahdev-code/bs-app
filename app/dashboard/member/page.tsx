'use client';

import { useEffect, useState } from 'react';
import { memberService } from '@/lib/api';
import { User } from '@/lib/types';
import { Users, Search, MessageCircle, UserPlus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/authStore';

export default function MemberPage() {
  const { user: currentUser } = useAuthStore();
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('pengguna');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    nama_lengkap: '',
    email: '',
    password: '',
    no_hp: '',
    kelurahan: '',
    kecamatan: '',
    kabupaten: '',
    detail_alamat: '',
    role: 'pengguna' as 'pengguna' | 'pengelola'
  });

  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    loadMembers();
  }, [roleFilter]);

  const loadMembers = async () => {
    try {
      const data = await memberService.list(roleFilter, searchQuery);
      setMembers(data);
    } catch (error) {
      console.error('Load members error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadMembers();
  };

  const handleWhatsApp = (noHp: string | undefined, nama: string) => {
    if (!noHp) {
      alert('Nomor HP tidak tersedia');
      return;
    }

    // Format nomor HP untuk WhatsApp (hapus karakter selain angka)
    let phoneNumber = noHp.replace(/\D/g, '');

    // Jika dimulai dengan 0, ganti dengan 62 (kode negara Indonesia)
    if (phoneNumber.startsWith('0')) {
      phoneNumber = '62' + phoneNumber.substring(1);
    } else if (!phoneNumber.startsWith('62')) {
      phoneNumber = '62' + phoneNumber;
    }

    const message = `Halo ${nama}, saya ingin menghubungi Anda terkait Bank Sampah.`;
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

    window.open(whatsappUrl, '_blank');
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    const { token } = useAuthStore.getState();

    try {
      const response = await fetch('/api/member/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(createFormData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Gagal membuat akun');
      }

      alert('Akun berhasil dibuat!');
      setShowCreateModal(false);
      setCreateFormData({
        nama_lengkap: '',
        email: '',
        password: '',
        no_hp: '',
        kelurahan: '',
        kecamatan: '',
        kabupaten: '',
        detail_alamat: '',
        role: 'pengguna'
      });
      loadMembers();
    } catch (error: any) {
      alert(error.message || 'Gagal membuat akun');
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus akun ${userName}? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }

    const { token } = useAuthStore.getState();

    try {
      const response = await fetch(`/api/member/delete/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Gagal menghapus akun');
      }

      alert('Akun berhasil dihapus!');
      loadMembers();
    } catch (error: any) {
      alert(error.message || 'Gagal menghapus akun');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
            <Users className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Daftar Member</h1>
            <p className="text-gray-600">Kelola data member bank sampah</p>
          </div>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <UserPlus className="w-5 h-5" />
            Tambah Akun
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama atau email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Cari
            </button>
          </form>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          >
            <option value="pengguna">Member</option>
            <option value="pengelola">Pengelola</option>
            <option value="admin">Admin</option>
            <option value="all">Semua Role</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Member</p>
          <p className="text-2xl font-bold text-gray-800">{members.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Saldo</p>
          <p className="text-2xl font-bold text-green-600">
            Rp {members.reduce((sum, m) => sum + parseFloat(m.saldo.toString()), 0).toLocaleString('id-ID')}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Nama
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  No. HP
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Saldo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Bergabung
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {members.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    Tidak ada data member
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 font-medium">
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {member.no_hp || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      Rp {parseFloat(member.saldo.toString()).toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                        {member.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(member.created_at).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleWhatsApp(member.no_hp, member.nama_lengkap)}
                          disabled={!member.no_hp}
                          className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                            member.no_hp
                              ? 'bg-green-600 hover:bg-green-700 text-white'
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          }`}
                          title={member.no_hp ? 'Hubungi via WhatsApp' : 'Nomor HP tidak tersedia'}
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span className="hidden sm:inline">WhatsApp</span>
                        </button>

                        {isAdmin && member.role !== 'admin' && (
                          <button
                            onClick={() => handleDeleteUser(member.id, member.nama_lengkap)}
                            className="inline-flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                            title="Hapus Akun"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="hidden sm:inline">Hapus</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah Akun */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-md w-full p-6 my-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Tambah Akun Baru</h3>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  value={createFormData.nama_lengkap}
                  onChange={(e) => setCreateFormData({ ...createFormData, nama_lengkap: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={createFormData.email}
                  onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  value={createFormData.password}
                  onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                    createFormData.password && createFormData.password.length < 8
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-indigo-500'
                  }`}
                  required
                  minLength={8}
                />
                {createFormData.password && createFormData.password.length < 8 ? (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <span>⚠️</span> Password harus minimal 8 karakter (saat ini: {createFormData.password.length})
                  </p>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">Minimal 8 karakter</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nomor HP
                </label>
                <input
                  type="tel"
                  value={createFormData.no_hp}
                  onChange={(e) => setCreateFormData({ ...createFormData, no_hp: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="08123456789"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kelurahan
                </label>
                <input
                  type="text"
                  value={createFormData.kelurahan}
                  onChange={(e) => setCreateFormData({ ...createFormData, kelurahan: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kecamatan
                </label>
                <input
                  type="text"
                  value={createFormData.kecamatan}
                  onChange={(e) => setCreateFormData({ ...createFormData, kecamatan: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kabupaten
                </label>
                <input
                  type="text"
                  value={createFormData.kabupaten}
                  onChange={(e) => setCreateFormData({ ...createFormData, kabupaten: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Detail Alamat
                </label>
                <textarea
                  value={createFormData.detail_alamat}
                  onChange={(e) => setCreateFormData({ ...createFormData, detail_alamat: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Jl. Contoh No. 123, RT 01/RW 02"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role *
                </label>
                <select
                  value={createFormData.role}
                  onChange={(e) => setCreateFormData({ ...createFormData, role: e.target.value as 'pengguna' | 'pengelola' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="pengguna">Member</option>
                  <option value="pengelola">Pengelola</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateFormData({
                      nama_lengkap: '',
                      email: '',
                      password: '',
                      no_hp: '',
                      kelurahan: '',
                      kecamatan: '',
                      kabupaten: '',
                      detail_alamat: '',
                      role: 'pengguna'
                    });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Buat Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}