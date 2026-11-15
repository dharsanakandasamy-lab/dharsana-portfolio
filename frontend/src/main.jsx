import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import Portfolio from './Portfolio';
import AdminApp from './admin/AdminApp';

function RootRouter() {
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  // Dedicated separate private admin dashboard route
  if (currentPath.startsWith('/admin')) {
    return <AdminApp />;
  }

  // Public portfolio (Default) - Zero admin buttons or links visible
  return <Portfolio />;
}

createRoot(document.getElementById('root')).render(<RootRouter />);
