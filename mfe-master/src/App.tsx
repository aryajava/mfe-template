import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Layers, Package, Truck, Home, UserCheck, Shield } from 'lucide-react';
import MasterRoutes from './routes/masterRoutes';
import { storage } from './utils/sastStorage';

/**
 * Root App untuk standalone development (port 5008)
 * Dilengkapi dengan bilah navigasi mandiri dan penguji peran (role tester)
 */
const App: React.FC = () => {
  const location = useLocation();
  const [currentRole, setCurrentRole] = useState<string>(() => {
    try {
      const raw = storage.retrieve('user');
      if (raw) {
        const u = JSON.parse(raw);
        return u.roles?.[0] || 'SA';
      }
    } catch {
      // ignore
    }
    return 'SA';
  });

  const isSa = currentRole.toUpperCase() === 'SA';
  const isOwner = currentRole.toUpperCase() === 'OWNER';

  const navPermissions: Record<string, boolean> = {
    'master-produk': true,
    'master-kategori': true,
    'master-ekspedisi': isSa || isOwner,
  };

  const handleRoleChange = (newRole: string) => {
    setCurrentRole(newRole);
    const mockUser = {
      id: newRole === 'SA' ? '1' : newRole === 'OWNER' ? '2' : '3',
      email: `${newRole.toLowerCase()}@tokogklaku.com`,
      name: `${newRole === 'SA' ? 'Super Admin' : newRole === 'OWNER' ? 'Pemilik Toko' : 'Admin Toko'} (Standalone)`,
      roles: [newRole.toLowerCase(), newRole.toUpperCase()],
      permissions: newRole === 'SA' || newRole === 'OWNER' ? ['*'] : ['read', 'write'],
    };
    storage.store('user', JSON.stringify(mockUser));
    // Trigger storage event or refresh to update guards and page permissions
    window.location.reload();
  };

  const navItems = [
    { label: 'Beranda', href: '/master', icon: Home, menuCode: '' },
    { label: 'Produk', href: '/master/produk', icon: Package, menuCode: 'master-produk' },
    { label: 'Kategori', href: '/master/kategori', icon: Layers, menuCode: 'master-kategori' },
    { label: 'Ekspedisi', href: '/master/ekspedisi', icon: Truck, menuCode: 'master-ekspedisi' },
  ];

  const visibleNavItems = navItems.filter((item) => {
    if (!item.menuCode) return true;
    return navPermissions[item.menuCode] ?? false;
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
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-lg text-xs">
              <Shield className="h-3.5 w-3.5 text-orange-600" />
              <span className="text-gray-500 font-medium">Uji Peran:</span>
              <select
                value={currentRole.toUpperCase()}
                onChange={(e) => handleRoleChange(e.target.value)}
                className="bg-transparent font-bold text-gray-800 focus:outline-none cursor-pointer text-xs"
              >
                <option value="SA">Super Admin (SA)</option>
                <option value="OWNER">Pemilik Toko (Owner)</option>
                <option value="ADMIN">Admin Toko (Admin)</option>
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
