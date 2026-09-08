import React from 'react';
import { AlertCircle } from 'lucide-react';

interface MFENotAvailableProps {
  mfeName: string;
  message?: string;
}

export const MFENotAvailable: React.FC<MFENotAvailableProps> = ({
  mfeName, message = 'This module is currently unavailable.'
}) => {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <AlertCircle className="h-6 w-6 text-yellow-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-yellow-900 mb-2">{mfeName} Not Available</h3>
            <p className="text-sm text-yellow-800 mb-4">{message}</p>
            <div className="text-xs text-yellow-700 bg-yellow-100 rounded p-3">
              <p className="font-medium mb-1">For Developers:</p>
              <p>This micro-frontend may not be running. Check if the dev server is started on the correct port.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
