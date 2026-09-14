import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  SharedProvider,
  LoadingProvider,
  GlobalLoadingOverlay,
  TooltipProvider,
  SonnerToaster,
} from '@template/shared';
import App from './App';
import './global.css';

const queryClient = new QueryClient();

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <SharedProvider queryClient={queryClient}>
          <LoadingProvider>
            <TooltipProvider>
              <App />
              <SonnerToaster />
              <GlobalLoadingOverlay />
            </TooltipProvider>
          </LoadingProvider>
        </SharedProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
