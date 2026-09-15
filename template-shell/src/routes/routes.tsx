import React from 'react';
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

export const AppRoutes: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/daftar" element={<Navigate to="/login?mode=register" replace />} />
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

        {/* Static MFE routes - configure your child MFEs here */}
        <Route
          path="/child/*"
          element={
            <MFEErrorBoundary mfeName="Child MFE">
              <LazyMFE
                scope="childMFE"
                module="./Module"
                url="http://localhost:5006/remoteEntry.js"
                basePath="/child"
              />
            </MFEErrorBoundary>
          }
        />

        <Route
          path="/hallo/*"
          element={
            <MFEErrorBoundary mfeName="MFE Hallo">
              <LazyMFE
                scope="mfeHallo"
                module="./Module"
                url="http://localhost:5007/remoteEntry.js"
                basePath="/hallo"
              />
            </MFEErrorBoundary>
          }
        />

        <Route
          path="/master/*"
          element={
            <MFEErrorBoundary mfeName="MFE Master">
              <LazyMFE
                scope="mfeMaster"
                module="./Module"
                url="http://localhost:5008/remoteEntry.js"
                basePath="/master"
              />
            </MFEErrorBoundary>
          }
        />

        {/* Modul Operasional & Monitoring (Backend-Driven Placeholder) */}
        <Route path="/operasional/*" element={<ModulePlaceholder title="Operasional" />} />
        <Route path="/monitoring/*" element={<ModulePlaceholder title="Monitoring" />} />
        <Route path="/maintenance/*" element={<ModulePlaceholder title="Maintenance" />} />
        <Route path="/pengaturan/*" element={<ModulePlaceholder title="Pengaturan" />} />
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
