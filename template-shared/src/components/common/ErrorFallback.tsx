import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorFallbackProps {
  error?: Error;
  resetErrorBoundary?: () => void;
  title?: string;
  description?: string;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetErrorBoundary,
  title = 'Something went wrong',
  description,
}) => {
  return (
    <div className="flex h-full min-h-[400px] items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2 text-destructive mb-4">
          <AlertCircle className="h-5 w-5" />
          <h3 className="font-semibold">{title}</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          {description || error?.message || 'An unexpected error occurred. Please try again.'}
        </p>
        {resetErrorBoundary && (
          <button
            onClick={resetErrorBoundary}
            className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};

export const MFEErrorFallback: React.FC<ErrorFallbackProps & { mfeName?: string }> = ({
  mfeName,
  ...props
}) => {
  return (
    <ErrorFallback
      {...props}
      title={`${mfeName || 'Module'} failed to load`}
      description="This module is temporarily unavailable. Please try again later."
    />
  );
};
