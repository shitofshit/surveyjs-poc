import React from 'react';
import { Routes, Route } from 'react-router-dom';
import CreatorPage from './pages/CreatorPage';
import RunnerPage from './pages/RunnerPage';
import HomePage from './pages/HomePage';
import Layout from './components/Layout';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/creator" element={<CreatorPage />} />
        <Route path="/runner" element={<RunnerPage />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
