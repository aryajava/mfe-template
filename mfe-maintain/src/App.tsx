import React from 'react';
import MaintainRoutes from './routes/maintainRoutes';

export const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <MaintainRoutes />
      </div>
    </div>
  );
};

export default App;
