import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { SharedProvider, TooltipProvider, SonnerToaster, LoadingProvider, GlobalLoadingOverlay } from '@template/shared';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import App from './App';
import './global.css';
import { initSharedDependencies } from './utils/sharedDependencies';

initSharedDependencies();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: (failureCount, error: unknown) => {
        const apiError = error as { status?: number };
        if (apiError?.status && apiError.status >= 400 && apiError.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});

const SharedAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const authContext = useAuth();
  return <SharedProvider authContext={authContext}>{children}</SharedProvider>;
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <SharedAuthProvider>
            <LoadingProvider>
              <TooltipProvider>
                <App />
                <SonnerToaster />
                <GlobalLoadingOverlay />
              </TooltipProvider>
            </LoadingProvider>
          </SharedAuthProvider>
        </AuthProvider>
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>
);
