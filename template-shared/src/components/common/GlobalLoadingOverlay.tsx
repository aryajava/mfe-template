import React from 'react';
import { useLoading } from '../../contexts/LoadingContext';
import { LoadingSpinner } from './LoadingSpinner';

export const GlobalLoadingOverlay: React.FC = () => {
  const { isLoading, loadingMessage } = useLoading();

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl p-8 flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" />
        {loadingMessage && (
          <p className="text-gray-700 text-lg font-medium">{loadingMessage}</p>
        )}
      </div>
    </div>
  );
};
