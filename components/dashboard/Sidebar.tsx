'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import { 
  Home, 
  Trash2, 
  History, 
  Wallet, 
  BookOpen, 
  Users, 
  FileText,
  LogOut,
  ListChecks
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const menuPengguna = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/dashboard/setor-sampah', label: 'Setor Sampah', icon: Trash2 },
    { href: '/dashboard/riwayat-sampah', label: 'Riwayat Sampah', icon: History },
    { href: '/dashboard/saldo', label: 'Saldo', icon: Wallet },
    { href: '/dashboard/edukasi', label: 'Edukasi', icon: BookOpen },
  ];

  const menuPengelola = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/dashboard/antrian-sampah', label: 'Antrian Sampah', icon: ListChecks },
    { href: '/dashboard/pencairan', label: 'Pencairan Saldo', icon: Wallet },
    { href: '/dashboard/riwayat-sampah', label: 'Riwayat Sampah', icon: History },
    { href: '/dashboard/member', label: 'Member', icon: Users },
    { href: '/dashboard/laporan', label: 'Laporan', icon: FileText },
  ];

  const menuAdmin = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/dashboard/laporan', label: 'Laporan', icon: FileText },
    { href: '/dashboard/member', label: 'Member', icon: Users },
    { href: '/dashboard/artikel', label: 'Artikel', icon: BookOpen },
    { href: '/dashboard/riwayat-sampah', label: 'Riwayat Sampah', icon: History },
    { href: '/dashboard/pencairan', label: 'Riwayat Pencairan', icon: Wallet },
  ];

  const getMenu = () => {
    if (user?.role === 'admin') return menuAdmin;
    if (user?.role === 'pengelola') return menuPengelola;
    return menuPengguna;
  };

  const menu = getMenu();

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 lg:block hidden">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center gap-2 px-6 py-4 border-b">
          <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
            <Trash2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg">Bank Sampah</h1>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {menu.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-green-50 text-green-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="border-t p-4">
          <div className="px-4 py-2 mb-2">
            <p className="font-medium text-sm">{user?.nama_lengkap}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}