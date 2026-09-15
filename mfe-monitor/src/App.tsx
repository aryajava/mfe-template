import React from 'react';
import MonitorRoutes from './routes/monitorRoutes';

export const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <MonitorRoutes />
      </div>
    </div>
  );
};

export default App;
