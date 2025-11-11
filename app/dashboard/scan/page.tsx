'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import { Camera, X, Search, CheckCircle } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

interface ScannedUser {
  id: string;
  nama_lengkap: string;
  email: string;
  saldo: number;
}

interface AntrianSampah {
  id: string;
  jenis_sampah: string;
  metode: 'pick-up' | 'drop-off';
  tanggal_setor: string;
  users?: {
    nama_lengkap: string;
    email: string;
    no_hp?: string;
  };
}

export default function ScanPage() {
  const { user, token } = useAuthStore();
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [scannedUser, setScannedUser] = useState<ScannedUser | null>(null);
  const [antrianList, setAntrianList] = useState<AntrianSampah[]>([]);
  const [selectedAntrian, setSelectedAntrian] = useState<AntrianSampah | null>(null);
  const [showAntrianList, setShowAntrianList] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [error, setError] = useState('');
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  // Validation form
  const [validationForm, setValidationForm] = useState({
    berat_sampah: '',
    harga_per_kg: ''
  });

  useEffect(() => {
    // Cleanup scanner on unmount
    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    try {
      setError('');
      setScanning(true);

      const html5QrCode = new Html5Qrcode("qr-reader");
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          // QR berhasil di-scan
          handleQRScan(decodedText);
          stopScanning();
        },
        (errorMessage) => {
          // Scanning error (normal saat mencari QR)
        }
      );
    } catch (err: any) {
      console.error('Start scanning error:', err);
      setError('Gagal mengakses kamera. Pastikan izin kamera sudah diberikan.');
      setScanning(false);
    }
  };

  const stopScanning = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
        html5QrCodeRef.current = null;
      } catch (err) {
        console.error('Stop scanning error:', err);
      }
    }
    setScanning(false);
  };

  const handleQRScan = async (qrData: string) => {
    // Extract user ID from QR data
    // Format QR: USER-timestamp-email atau langsung user_id
    try {
      // Coba parse sebagai user ID langsung dulu
      await fetchUserByQR(qrData);
    } catch (err) {
      setError('QR Code tidak valid');
    }
  };

  const fetchUserByQR = async (qrData: string) => {
    if (!token) return;

    try {
      const response = await fetch(`/api/member/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ qr_data: qrData })
      });

      if (!response.ok) {
        throw new Error('User tidak ditemukan');
      }

      const userData = await response.json();
      setScannedUser(userData);

      // Fetch antrian pending milik user ini
      await fetchAntrianUser(userData.id);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data user');
    }
  };

  const fetchAntrianUser = async (userId: string) => {
    if (!token) return;

    try {
      // Fetch semua setoran pending milik user ini
      const response = await fetch('/api/setoran/list', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Gagal memuat antrian');
      }

      const allSetoran = await response.json();
      const userPendingAntrian = allSetoran.filter(
        (s: any) => s.user_id === userId && s.status === 'pending'
      );

      if (userPendingAntrian.length === 0) {
        setError('Tidak ada antrian sampah untuk member ini');
        setScannedUser(null);
        return;
      }

      setAntrianList(userPendingAntrian);

      // Jika hanya 1 antrian, langsung tampilkan form validasi
      if (userPendingAntrian.length === 1) {
        setSelectedAntrian(userPendingAntrian[0]);
        setShowValidationModal(true);
      } else {
        // Jika lebih dari 1, tampilkan list untuk dipilih
        setShowAntrianList(true);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat antrian');
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!manualCode || manualCode.length < 3) {
      setError('Kode harus minimal 3 karakter');
      return;
    }

    if (!token) return;

    try {
      const response = await fetch(`/api/member/by-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code: manualCode.toUpperCase() })
      });

      if (!response.ok) {
        throw new Error('Kode tidak ditemukan');
      }

      const userData = await response.json();
      setScannedUser(userData);
      setManualCode('');

      // Fetch antrian pending milik user ini
      await fetchAntrianUser(userData.id);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data user');
    }
  };

  const handleValidationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAntrian || !selectedAntrian.id || !token) return;

    try {
      const response = await fetch(`/api/setoran/validate/${selectedAntrian.id}`, {
        method: 'POST', // FIX: Changed from PUT to POST to match API route
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          berat_sampah: parseFloat(validationForm.berat_sampah),
          harga_per_kg: parseFloat(validationForm.harga_per_kg)
        })
      });

      if (!response.ok) {
        throw new Error('Gagal memvalidasi setoran');
      }

      alert('Setoran berhasil divalidasi!');
      setShowValidationModal(false);
      setShowAntrianList(false);
      setScannedUser(null);
      setSelectedAntrian(null);
      setAntrianList([]);
      setValidationForm({
        berat_sampah: '',
        harga_per_kg: ''
      });
    } catch (err: any) {
      alert(err.message || 'Gagal memvalidasi setoran');
    }
  };

  const handleSelectAntrian = (antrian: AntrianSampah) => {
    setSelectedAntrian(antrian);
    setShowAntrianList(false);
    setShowValidationModal(true);
  };

  // Redirect if not admin or pengelola
  useEffect(() => {
    if (user && user.role !== 'admin' && user.role !== 'pengelola') {
      window.location.href = '/dashboard';
    }
  }, [user]);

  if (!user || (user.role !== 'admin' && user.role !== 'pengelola')) {
    return null;
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
          <Camera className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Scan QR Member</h1>
          <p className="text-gray-600">Scan QR code atau masukkan kode manual</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QR Scanner */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Scan QR Code</h3>

          <div className="mb-4">
            {!scanning ? (
              <button
                onClick={startScanning}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Camera className="w-5 h-5" />
                Mulai Scan
              </button>
            ) : (
              <button
                onClick={stopScanning}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                <X className="w-5 h-5" />
                Stop Scan
              </button>
            )}
          </div>

          <div
            id="qr-reader"
            className="w-full rounded-lg overflow-hidden bg-gray-900"
            style={{ minHeight: scanning ? '300px' : '0px' }}
          ></div>

          {!scanning && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                Klik tombol "Mulai Scan" untuk mengaktifkan kamera dan scan QR code member.
              </p>
            </div>
          )}
        </div>

        {/* Manual Input */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Input Manual Kode</h3>

          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kode Unik Member (3 digit)
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                  placeholder="Contoh: ABC"
                  maxLength={3}
                  className="w-full sm:flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-lg font-mono uppercase"
                  required
                />
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <Search className="w-5 h-5" />
                  Cari
                </button>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-700">
                Masukkan 3 digit kode unik yang ditampilkan di dashboard member.
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* Modal List Antrian (jika > 1) */}
      {showAntrianList && scannedUser && antrianList.length > 1 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-3xl w-full p-6 my-8 mx-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Pilih Antrian Sampah</h3>
                <p className="text-sm text-gray-600">Member: {scannedUser.nama_lengkap}</p>
              </div>
              <button
                onClick={() => {
                  setShowAntrianList(false);
                  setScannedUser(null);
                  setAntrianList([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-3">
              {antrianList.map((antrian) => (
                <div
                  key={antrian.id}
                  className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-green-500 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => handleSelectAntrian(antrian)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                          {antrian.jenis_sampah}
                        </span>
                        <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                          antrian.metode === 'pick-up'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {antrian.metode === 'pick-up' ? 'Pick Up' : 'Drop Off'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Tanggal: {new Date(antrian.tanggal_setor).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    <button
                      className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Pilih
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal Validasi */}
      {showValidationModal && scannedUser && selectedAntrian && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 my-8 mx-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Validasi Setoran Sampah</h3>
                  <p className="text-sm text-gray-600">Input berat dan harga sampah</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowValidationModal(false);
                  setSelectedAntrian(null);
                  setScannedUser(null);
                  setAntrianList([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Member Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-2xl">
                    {scannedUser.nama_lengkap.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-lg">{scannedUser.nama_lengkap}</p>
                  <p className="text-gray-600 text-sm">{scannedUser.email}</p>
                  <p className="text-green-600 font-medium mt-1">
                    Saldo: Rp {scannedUser.saldo.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            </div>

            {/* Info Antrian */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full">
                  {selectedAntrian.jenis_sampah}
                </span>
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                  selectedAntrian.metode === 'pick-up'
                    ? 'bg-orange-100 text-orange-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {selectedAntrian.metode === 'pick-up' ? 'Pick Up' : 'Drop Off'}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                Tanggal Setor: {new Date(selectedAntrian.tanggal_setor).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>

            {/* Validation Form */}
            <form onSubmit={handleValidationSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Berat Sampah (Kg) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={validationForm.berat_sampah}
                    onChange={(e) => setValidationForm({ ...validationForm, berat_sampah: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Harga per Kg (Rp) *
                  </label>
                  <input
                    type="number"
                    step="100"
                    value={validationForm.harga_per_kg}
                    onChange={(e) => setValidationForm({ ...validationForm, harga_per_kg: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="0"
                    required
                  />
                </div>
              </div>

              {/* Total Calculation */}
              {validationForm.berat_sampah && validationForm.harga_per_kg && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-700 mb-1">Total Harga</p>
                  <p className="text-2xl font-bold text-green-600">
                    Rp {(parseFloat(validationForm.berat_sampah) * parseFloat(validationForm.harga_per_kg)).toLocaleString('id-ID')}
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowValidationModal(false);
                    setSelectedAntrian(null);
                    setScannedUser(null);
                    setAntrianList([]);
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Validasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
