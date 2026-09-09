import React from 'react';
import { useLocation } from 'react-router-dom';
import { SharedProvider, LoadingProvider, GlobalLoadingOverlay } from '@template/shared';
import Home from './pages/Home';
import Detail from './pages/Detail';
import NotFound from './pages/NotFound';
import './global.css';

interface ModuleProps {
  basePath?: string;
  subRoute?: string;
}

const ModuleContent: React.FC<ModuleProps> = ({
  basePath = '/hallo',
  subRoute,
}) => {
  const location = useLocation();
  const currentPath = location.pathname;

  console.log(
    '[MFE Hallo] Rendering - currentPath:',
    currentPath,
    'basePath:',
    basePath,
    'subRoute:',
    subRoute,
  );

  // Route based on subRoute or current path
  if (subRoute) {
    // Add your sub-route handling here
    // Example:
    // if (subRoute === 'settings') return <Settings />;
    // if (subRoute === 'details') return <Details />;
    if (subRoute === 'detail') return <Detail />;
  }

  // Path-based fallback routing
  const relativePath = currentPath.replace(basePath, '').replace(/^\//, '');

  if (relativePath === '' || relativePath === '/') {
    return <Home />;
  }

  // Add more path matching here as needed
  // if (relativePath.startsWith('settings')) return <Settings />;
  if (relativePath.startsWith('detail')) return <Detail />;

  return <NotFound />;
};

const Module: React.FC<ModuleProps> = (props) => {
  return (
    <SharedProvider>
      <LoadingProvider>
        <ModuleContent {...props} />
        <GlobalLoadingOverlay />
      </LoadingProvider>
    </SharedProvider>
  );
};

export default Module;
