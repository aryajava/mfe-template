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
 * Katalog Konfigurasi Remote Micro-Frontend Fisik.
 * Memetakan logical mfeKey dari backend ke bundel Module Federation fisik.
 */
interface MfeCatalogEntry {
  name: string;
  scope: string;
  module: string;
  url: string;
}

const getMfeUrl = (scope: string, defaultPort: number): string => {
  if (typeof window !== 'undefined' && (window as any)._env?.getMfeUrl) {
    const url = (window as any)._env.getMfeUrl(scope);
    if (url) return url;
  }
  return `http://localhost:${defaultPort}/remoteEntry.js`;
};

const MFE_CATALOG: Record<string, MfeCatalogEntry> = {
  master: {
    name: 'MFE Master',
    scope: 'mfeMaster',
    module: './Module',
    url: getMfeUrl('mfeMaster', 5008),
  },
  trx: {
    name: 'MFE Trx',
    scope: 'mfeTrx',
    module: './Module',
    url: getMfeUrl('mfeTrx', 5009),
  },
  monitor: {
    name: 'MFE Monitor',
    scope: 'mfeMonitor',
    module: './Module',
    url: getMfeUrl('mfeMonitor', 5010),
  },
  report: {
    name: 'MFE Report',
    scope: 'mfeReport',
    module: './Module',
    url: getMfeUrl('mfeReport', 5011),
  },
  maintain: {
    name: 'MFE Maintain',
    scope: 'mfeMaintain',
    module: './Module',
    url: getMfeUrl('mfeMaintain', 5012),
  },
  child: {
    name: 'Child MFE',
    scope: 'childMFE',
    module: './Module',
    url: getMfeUrl('childMfe', 5006),
  },
  hallo: {
    name: 'MFE Hallo',
    scope: 'mfeHallo',
    module: './Module',
    url: getMfeUrl('mfeHallo', 5007),
  },
};

export const AppRoutes: React.FC = () => {
  const { isAuthenticated, isLoading, menuPermissions } = useAuth();

  // Ekstrak grup menu dan rute standalone dinamis berizin canRead dari backend
  const { dynamicGroups, standaloneRoutes } = useMemo(() => {
    const groupsMap = new Map<
      string,
      { code: string; name: string; urlPrefix: string; mfeKey?: string }
    >();
    const standaloneMap = new Map<string, string>(); // segment -> title

    for (const item of Object.values(menuPermissions)) {
      if (!item || !item.canRead) continue;

      const groupCode = (item.groupCode || '').toLowerCase().trim();
      if (groupCode && groupCode !== 'beranda') {
        if (!groupsMap.has(groupCode)) {
          const rawPrefix = (item.groupUrlPrefix || `/${groupCode}`).trim();
          const normalizedPrefix = rawPrefix.startsWith('/') ? rawPrefix : `/${rawPrefix}`;
          groupsMap.set(groupCode, {
            code: groupCode,
            name: item.groupName || groupCode,
            urlPrefix: normalizedPrefix,
            mfeKey: item.mfeKey?.trim().toLowerCase() || undefined,
          });
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

    const groups = Array.from(groupsMap.values());
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
        <Route
          path="/child/*"
          element={
            <MFEErrorBoundary mfeName={MFE_CATALOG.child.name}>
              <LazyMFE
                scope={MFE_CATALOG.child.scope}
                module={MFE_CATALOG.child.module}
                url={MFE_CATALOG.child.url}
                basePath="/child"
              />
            </MFEErrorBoundary>
          }
        />
        <Route
          path="/hallo/*"
          element={
            <MFEErrorBoundary mfeName={MFE_CATALOG.hallo.name}>
              <LazyMFE
                scope={MFE_CATALOG.hallo.scope}
                module={MFE_CATALOG.hallo.module}
                url={MFE_CATALOG.hallo.url}
                basePath="/hallo"
              />
            </MFEErrorBoundary>
          }
        />

        {/*
         * Backend-Driven Dynamic Group Routes (ADR 0002)
         * - Menghubungkan logical group dari BE ke physical MFE via mfeKey.
         * - 1 MFE fisik (mis. mfe-report) dapat melayani N grup (mis. /report dan /cetak).
         * - Strict Null: Jika mfeKey null/kosong/tidak terdaftar, render ModulePlaceholder.
         */}
        {dynamicGroups.map(({ code, name, urlPrefix, mfeKey }) => {
          const mfeConfig = mfeKey ? MFE_CATALOG[mfeKey] : null;

          return (
            <Route
              key={code}
              path={`${urlPrefix}/*`}
              element={
                mfeConfig ? (
                  <MFEErrorBoundary mfeName={name}>
                    <LazyMFE
                      scope={mfeConfig.scope}
                      module={mfeConfig.module}
                      url={mfeConfig.url}
                      basePath={urlPrefix}
                    />
                  </MFEErrorBoundary>
                ) : (
                  <ModulePlaceholder title={name} />
                )
              }
            />
          );
        })}

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
