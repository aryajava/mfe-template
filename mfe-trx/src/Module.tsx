import React from 'react';
import {
  SharedProvider,
  LoadingProvider,
  GlobalLoadingOverlay,
  TooltipProvider,
} from '@template/shared';
import TrxRoutes from './routes/trxRoutes';
import './global.css';

interface ModuleProps {
  basePath?: string;
  subRoute?: string;
}

const ModuleContent: React.FC<ModuleProps> = () => {
  return <TrxRoutes />;
};

const Module: React.FC<ModuleProps> = () => {
  return (
    <SharedProvider>
      <LoadingProvider>
        <TooltipProvider>
          <ModuleContent />
          <GlobalLoadingOverlay />
        </TooltipProvider>
      </LoadingProvider>
    </SharedProvider>
  );
};

export default Module;
