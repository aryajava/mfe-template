import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Layout from '../components/Layout';
import { ProtectedRoute } from './ProtectedRoute';
import { MFEErrorBoundary } from '../components/ErrorBoundary';
import { LazyMFE } from '../components/LazyMFE';

import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import NotFound from '../pages/NotFound';
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
