'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Box, CircularProgress } from '@mui/material';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Simple mock auth check
    const checkAuth = async () => {
      // simulate check
      await new Promise(r => setTimeout(r, 500));
      const auth = true; // Set to true for demo
      setIsAuthenticated(auth);
      
      if (!auth && pathname !== '/login') {
        router.replace('/login');
      }
    };
    
    checkAuth();
  }, [pathname, router]);

  if (isAuthenticated === null) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return <>{children}</>;
};

export default AuthGuard;
