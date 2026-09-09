import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import NotFound from './pages/NotFound';
import Detail from './pages/Detail';

const App: React.FC = () => {
  return (
    <Routes>
      <Route index element={<Home />} />
      <Route path="detail" element={<Detail />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default App;
