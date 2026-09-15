import React, { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Layers, Package, Truck, Home, Shield, RefreshCw } from 'lucide-react';
import { useAuth } from '@template/shared';
import MasterRoutes from './routes/masterRoutes';
import { storage } from './utils/sastStorage';

/**
 * Root App untuk standalone development (port 5008)
 * Dilengkapi dengan bilah navigasi dinamis dan penguji peran (role tester)
 */
const App: React.FC = () => {
  const location = useLocation();
  const { user, canAccessMenu } = useAuth();

  const [currentRole, setCurrentRole] = useState<string>(() => {
    try {
      const raw = storage.retrieve('user');
      if (raw) {
        const u = JSON.parse(raw);
        return u.roles?.[0] || 'ADMIN';
      }
    } catch {
      // ignore
    }
    return 'ADMIN';
  });

  const handleRoleChange = (newRole: string) => {
    setCurrentRole(newRole);
    if (newRole === 'GUEST') {
      storage.remove('user');
      storage.remove('menuPermissions');
      storage.remove('apiKey');
      storage.remove('token');
      window.location.reload();
      return;
    }

    const mockUser = {
      id: newRole === 'SA' ? '1' : newRole === 'OWNER' ? '2' : newRole === 'ADMIN' ? '3' : '4',
      email: `${newRole.toLowerCase()}@tokogklaku.com`,
      name: `${
        newRole === 'SA'
          ? 'Super Admin'
          : newRole === 'OWNER'
          ? 'Pemilik Toko'
          : newRole === 'ADMIN'
          ? 'Admin Toko'
          : 'Staf Toko'
      } (Standalone)`,
      roles: [newRole.toLowerCase(), newRole.toUpperCase()],
      permissions: newRole === 'SA' || newRole === 'OWNER' ? ['*'] : ['read', 'write'],
    };
    storage.store('user', JSON.stringify(mockUser));
    // Hapus override permission agar bootstrap menggunakan aturan matriks peran yang sinkron
    storage.remove('menuPermissions');
    window.location.reload();
  };

  const handleSyncWithBackend = async () => {
    const defaultKey = storage.retrieve('apiKey') || '733939ea4a1b4844a2c63737961ed35b';
    const apiKey = prompt('Masukkan X-Api-Key backend C# (:5251):', defaultKey);
    if (!apiKey) return;

    try {
      const res = await fetch('http://localhost:5251/api/role-menus/my-permissions', {
        headers: { 'X-Api-Key': apiKey, 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const rawPerms = json.data?.permissions || json.permissions || {};
      const normalized: Record<string, any> = {};
      for (const [k, v] of Object.entries(rawPerms)) {
        normalized[k.toLowerCase()] = v;
        if ((v as any).fullPath) {
          normalized[(v as any).fullPath.toLowerCase()] = v;
        }
      }

      storage.store('apiKey', apiKey);
      storage.store('token', apiKey);
      storage.store('menuPermissions', JSON.stringify(normalized));

      // Fetch user profil jika ada
      const userRes = await fetch('http://localhost:5251/api/auth/me', {
        headers: { 'X-Api-Key': apiKey },
      }).catch(() => null);

      if (userRes && userRes.ok) {
        const userJson = await userRes.json();
        const u = userJson.data || userJson;
        const role = u.role || json.data?.role || 'ADMIN';
        storage.store(
          'user',
          JSON.stringify({
            id: String(u.id || '1'),
            name: u.displayName || u.username || 'User Backend',
            email: u.username || 'user@backend.local',
            roles: [role.toLowerCase(), role.toUpperCase()],
            permissions: role.toUpperCase() === 'SA' ? ['*'] : ['read', 'write'],
          })
        );
      } else {
        const role = json.data?.role || 'ADMIN';
        storage.store(
          'user',
          JSON.stringify({
            id: '1',
            name: `User Backend (${role})`,
            email: `${role.toLowerCase()}@tokogklaku.com`,
            roles: [role.toLowerCase(), role.toUpperCase()],
            permissions: role.toUpperCase() === 'SA' ? ['*'] : ['read', 'write'],
          })
        );
      }

      alert('Berhasil sinkronisasi hak akses langsung dari backend C#!');
      window.location.reload();
    } catch (err) {
      alert(`Gagal sinkronisasi dengan backend: ${err}`);
    }
  };

  const navItems = [
    { label: 'Beranda', href: '/master', icon: Home, menuCode: '' },
    { label: 'Produk', href: '/master/produk', icon: Package, menuCode: 'master-produk' },
    { label: 'Kategori', href: '/master/kategori', icon: Layers, menuCode: 'master-kategori' },
    { label: 'Ekspedisi', href: '/master/ekspedisi', icon: Truck, menuCode: 'master-ekspedisi' },
  ];

  // Dynamic menu filtering berbasis canAccessMenu (sama persis seperti Shell)
  const visibleNavItems = navItems.filter((item) => {
    if (!item.menuCode) return true;
    return canAccessMenu(item.menuCode);
  });

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
      {/* Standalone Top Bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <Link to="/master" className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-orange-600 flex items-center justify-center text-white shadow-xs">
                <Package className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base text-gray-900 leading-tight">
                  MFE Master Data
                </span>
                <span className="text-[10px] font-semibold text-orange-600 bg-orange-50 px-1.5 py-0.2 rounded self-start border border-orange-200">
                  Mode Mandiri (:5008)
                </span>
              </div>
            </Link>

            {/* Navigasi Standalone */}
            <nav className="hidden md:flex items-center gap-1">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === '/master'
                    ? location.pathname === '/master' || location.pathname === '/'
                    : location.pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      isActive
                        ? 'bg-orange-50 text-orange-600 border border-orange-200/60'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Penguji Peran (Role Switcher Standalone) */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSyncWithBackend}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-orange-600 transition-colors shadow-2xs cursor-pointer"
              title="Sinkronkan hak akses langsung dari backend C# (:5251)"
            >
              <RefreshCw className="h-3.5 w-3.5 text-orange-600" />
              <span>Sinkron API</span>
            </button>

            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-lg text-xs">
              <Shield className="h-3.5 w-3.5 text-orange-600" />
              <span className="text-gray-500 font-medium">Uji Peran:</span>
              <select
                value={currentRole.toUpperCase()}
                onChange={(e) => handleRoleChange(e.target.value)}
                className="bg-transparent font-bold text-gray-800 focus:outline-none cursor-pointer text-xs"
              >
                <option value="ADMIN">Admin Toko (Hanya Produk)</option>
                <option value="OWNER">Pemilik Toko (Semua Master)</option>
                <option value="SA">Super Admin (Semua Akses)</option>
                <option value="STAFF">Staf Toko (Hanya Lihat)</option>
                <option value="GUEST">Tamu (Tanpa Akses)</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1">
        <Routes>
          {/* Mendukung URL dengan prefix /master/* saat diuji standalone */}
          <Route path="/master/*" element={<MasterRoutes />} />

          {/* Mendukung URL langsung di root /* saat diuji standalone */}
          <Route path="/*" element={<MasterRoutes />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
