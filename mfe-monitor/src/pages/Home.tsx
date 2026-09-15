import React from 'react';
import { Navigate } from 'react-router-dom';

export const Home: React.FC = () => {
  return <Navigate to="permintaan-diskon" replace />;
};

export default Home;
