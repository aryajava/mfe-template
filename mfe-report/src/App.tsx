import React from 'react';
import ReportRoutes from './routes/reportRoutes';

export const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <ReportRoutes />
      </div>
    </div>
  );
};

export default App;
