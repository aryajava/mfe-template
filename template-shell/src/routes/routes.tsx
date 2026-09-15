import React, { useMemo } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Layout from '../components/Layout';
import { ProtectedRoute } from './ProtectedRoute';
import { MFEErrorBoundary } from '../components/ErrorBoundary';
import { LazyMFE } from '../components/LazyMFE';

import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import NotFound from '../pages/NotFound';
import ModulePlaceholder from '../pages/ModulePlaceholder';
import { useAuth } from '../contexts/AuthContext';
import { PageLoader } from '@template/shared';

/**
 * Registry Remote Micro-Frontend Fisik.
 * Mendaftarkan modul-modul MFE yang telah memiliki bundel Remote fisik
 * dan terdistribusi via Webpack Module Federation.
 */
const REMOTE_MFE_REGISTRY: Record<string, React.ReactNode> = {
  master: (
    <MFEErrorBoundary mfeName="MFE Master">
      <LazyMFE
        scope="mfeMaster"
        module="./Module"
        url="http://localhost:5008/remoteEntry.js"
        basePath="/master"
      />
    </MFEErrorBoundary>
  ),
  child: (
    <MFEErrorBoundary mfeName="Child MFE">
      <LazyMFE
        scope="childMFE"
        module="./Module"
        url="http://localhost:5006/remoteEntry.js"
        basePath="/child"
      />
    </MFEErrorBoundary>
  ),
  hallo: (
    <MFEErrorBoundary mfeName="MFE Hallo">
      <LazyMFE
        scope="mfeHallo"
        module="./Module"
        url="http://localhost:5007/remoteEntry.js"
        basePath="/hallo"
      />
    </MFEErrorBoundary>
  ),
  trx: (
    <MFEErrorBoundary mfeName="MFE Trx">
      <LazyMFE
        scope="mfeTrx"
        module="./Module"
        url="http://localhost:5009/remoteEntry.js"
        basePath="/trx"
      />
    </MFEErrorBoundary>
  ),
  transaksi: (
    <MFEErrorBoundary mfeName="MFE Trx">
      <LazyMFE
        scope="mfeTrx"
        module="./Module"
        url="http://localhost:5009/remoteEntry.js"
        basePath="/transaksi"
      />
    </MFEErrorBoundary>
  ),
  operasional: (
    <MFEErrorBoundary mfeName="MFE Trx">
      <LazyMFE
        scope="mfeTrx"
        module="./Module"
        url="http://localhost:5009/remoteEntry.js"
        basePath="/operasional"
      />
    </MFEErrorBoundary>
  ),
  pesanan: (
    <MFEErrorBoundary mfeName="MFE Trx">
      <LazyMFE
        scope="mfeTrx"
        module="./Module"
        url="http://localhost:5009/remoteEntry.js"
        basePath="/pesanan"
      />
    </MFEErrorBoundary>
  ),
  monitor: (
    <MFEErrorBoundary mfeName="MFE Monitor">
      <LazyMFE
        scope="mfeMonitor"
        module="./Module"
        url="http://localhost:5010/remoteEntry.js"
        basePath="/monitor"
      />
    </MFEErrorBoundary>
  ),
  monitoring: (
    <MFEErrorBoundary mfeName="MFE Monitor">
      <LazyMFE
        scope="mfeMonitor"
        module="./Module"
        url="http://localhost:5010/remoteEntry.js"
        basePath="/monitoring"
      />
    </MFEErrorBoundary>
  ),
  report: (
    <MFEErrorBoundary mfeName="MFE Report">
      <LazyMFE
        scope="mfeReport"
        module="./Module"
        url="http://localhost:5011/remoteEntry.js"
        basePath="/report"
      />
    </MFEErrorBoundary>
  ),
  laporan: (
    <MFEErrorBoundary mfeName="MFE Report">
      <LazyMFE
        scope="mfeReport"
        module="./Module"
        url="http://localhost:5011/remoteEntry.js"
        basePath="/laporan"
      />
    </MFEErrorBoundary>
  ),
  maintain: (
    <MFEErrorBoundary mfeName="MFE Maintain">
      <LazyMFE
        scope="mfeMaintain"
        module="./Module"
        url="http://localhost:5012/remoteEntry.js"
        basePath="/maintain"
      />
    </MFEErrorBoundary>
  ),
  maintenance: (
    <MFEErrorBoundary mfeName="MFE Maintain">
      <LazyMFE
        scope="mfeMaintain"
        module="./Module"
        url="http://localhost:5012/remoteEntry.js"
        basePath="/maintenance"
      />
    </MFEErrorBoundary>
  ),
  pengaturan: (
    <MFEErrorBoundary mfeName="MFE Maintain">
      <LazyMFE
        scope="mfeMaintain"
        module="./Module"
        url="http://localhost:5012/remoteEntry.js"
        basePath="/pengaturan"
      />
    </MFEErrorBoundary>
  ),
};

export const AppRoutes: React.FC = () => {
  const { isAuthenticated, isLoading, menuPermissions } = useAuth();

  // Ekstrak grup menu dan rute standalone dinamis berizin canRead dari backend
  const { dynamicGroups, standaloneRoutes } = useMemo(() => {
    const groupsMap = new Map<string, string>(); // groupCode -> groupName
    const standaloneMap = new Map<string, string>(); // segment -> title

    for (const item of Object.values(menuPermissions)) {
      if (!item || !item.canRead) continue;

      const groupCode = (item.groupCode || '').toLowerCase().trim();
      if (groupCode && groupCode !== 'beranda') {
        if (!groupsMap.has(groupCode)) {
          groupsMap.set(groupCode, item.groupName || groupCode);
        }
      }

      // Evaluasi kemungkinan rute standalone di luar rute grup utama
      const fullPath = (item.fullPath || item.urlPrefix || '').trim();
      if (fullPath && fullPath !== '/dashboard' && fullPath !== '/') {
        const segments = fullPath.split('/').filter(Boolean);
        const rootSegment = segments[0]?.toLowerCase();
        if (rootSegment && rootSegment !== groupCode) {
          if (!standaloneMap.has(rootSegment)) {
            standaloneMap.set(rootSegment, item.menuName || rootSegment);
          }
        }
      }
    }

    const groups = Array.from(groupsMap.entries()).map(([code, name]) => ({ code, name }));
    const standalone = Array.from(standaloneMap.entries())
      .filter(([segment]) => !groupsMap.has(segment))
      .map(([segment, title]) => ({ segment, title }));

    return { dynamicGroups: groups, standaloneRoutes: standalone };
  }, [menuPermissions]);

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/ganti-kata-sandi" element={<Navigate to="/login?mode=reset" replace />} />
      <Route path="/reset-password" element={<Navigate to="/login?mode=reset" replace />} />

      {/* Protected routes with Layout */}
      <Route
        element={
          <ProtectedRoute>
            <Layout>
              <Outlet />
            </Layout>
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Static test/starter remote MFEs */}
        <Route path="/child/*" element={REMOTE_MFE_REGISTRY.child} />
        <Route path="/hallo/*" element={REMOTE_MFE_REGISTRY.hallo} />

        {/* Specific MFE Route Overrides */}
        <Route
          path="/monitoring/laporan-penjualan/*"
          element={REMOTE_MFE_REGISTRY.report}
        />
        <Route
          path="/monitoring/permintaan-diskon/*"
          element={REMOTE_MFE_REGISTRY.monitor}
        />
        <Route
          path="/monitoring/persetujuan-diskon/*"
          element={REMOTE_MFE_REGISTRY.monitor}
        />
        <Route
          path="/transaksi/pesanan/*"
          element={REMOTE_MFE_REGISTRY.trx}
        />
        <Route
          path="/operasional/pesanan/*"
          element={REMOTE_MFE_REGISTRY.trx}
        />
        <Route
          path="/pengaturan/pengaturan-aplikasi/*"
          element={REMOTE_MFE_REGISTRY.maintain}
        />
        <Route
          path="/pengaturan/pengaturan-toko/*"
          element={REMOTE_MFE_REGISTRY.maintain}
        />
        <Route
          path="/maintenance/grup-menu/*"
          element={REMOTE_MFE_REGISTRY.maintenance}
        />
        <Route
          path="/maintenance/menu/*"
          element={REMOTE_MFE_REGISTRY.maintenance}
        />
        <Route
          path="/pengaturan/grup-menu/*"
          element={REMOTE_MFE_REGISTRY.maintain}
        />
        <Route
          path="/pengaturan/menu/*"
          element={REMOTE_MFE_REGISTRY.maintain}
        />

        {/* Direct standalone routes */}
        <Route path="/pesanan/*" element={REMOTE_MFE_REGISTRY.trx} />
        <Route path="/permintaan-diskon/*" element={REMOTE_MFE_REGISTRY.monitor} />
        <Route path="/persetujuan-diskon/*" element={REMOTE_MFE_REGISTRY.monitor} />
        <Route path="/laporan-penjualan/*" element={REMOTE_MFE_REGISTRY.report} />
        <Route path="/pengaturan-aplikasi/*" element={REMOTE_MFE_REGISTRY.maintain} />
        <Route path="/pengaturan-toko/*" element={REMOTE_MFE_REGISTRY.maintain} />
        <Route path="/grup-menu/*" element={REMOTE_MFE_REGISTRY.maintain} />
        <Route path="/menu/*" element={REMOTE_MFE_REGISTRY.maintain} />

        {/* Backend-Driven Dynamic Group Routes */}
        {dynamicGroups.map(({ code, name }) => (
          <Route
            key={code}
            path={`/${code}/*`}
            element={
              REMOTE_MFE_REGISTRY[code] || <ModulePlaceholder title={name} />
            }
          />
        ))}

        {/* Backend-Driven Dynamic Standalone Routes */}
        {standaloneRoutes.map(({ segment, title }) => (
          <Route
            key={segment}
            path={`/${segment}/*`}
            element={<ModulePlaceholder title={title} />}
          />
        ))}
      </Route>

      {/* Redirect unauthenticated to login */}
      <Route
        path="*"
        element={
          isAuthenticated ? <NotFound /> : <Navigate to="/login" replace />
        }
      />
    </Routes>
  );
};
