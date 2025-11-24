import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';

const Layout: React.FC = () => {
  return (
    <div className="flex flex-column h-full">
      <Header />
      <div className="overflow-y-auto flex flex-1 flex-column">
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;
