import React from 'react';
import {
  SharedProvider,
  LoadingProvider,
  GlobalLoadingOverlay,
  TooltipProvider,
} from '@template/shared';
import ReportRoutes from './routes/reportRoutes';

interface ModuleProps {
  basePath?: string;
  subRoute?: string;
}

const ModuleContent: React.FC<ModuleProps> = () => {
  return <ReportRoutes />;
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
