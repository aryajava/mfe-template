import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MasterRoutes from './routes/masterRoutes';

/**
 * Root App untuk standalone development (port 5008)
 */
const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Routes>
        {/* Mendukung URL dengan prefix /master/* saat diuji standalone */}
        <Route path="/master/*" element={<MasterRoutes />} />

        {/* Mendukung URL langsung di root /* saat diuji standalone */}
        <Route path="/*" element={<MasterRoutes />} />
      </Routes>
    </div>
  );
};

export default App;
