import React from 'react';

const NotFound: React.FC = () => {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center">
      <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
      <h2 className="mt-4 text-xl font-semibold">Page Not Found</h2>
      <p className="mt-2 text-muted-foreground">
        The page you're looking for doesn't exist in this module.
      </p>
    </div>
  );
};

export default NotFound;
