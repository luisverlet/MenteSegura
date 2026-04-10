'use client';

import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import SideNav from './SideNav';
import { Power } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'transparent' }}>
      <SideNav />
      
      <Box sx={{ flex: 1, ml: '80px', p: 4, display: 'flex', flexDirection: 'column' }}>
        {/* Header Section */}
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 4 
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box 
              sx={{ 
                width: 56, 
                height: 56, 
                backgroundColor: '#4F8CFF', 
                borderRadius: '12px', 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                color: '#FFF' 
              }}
            >
              <Box sx={{ fontSize: '24px', fontWeight: 'bold' }}>D</Box>
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#1E293B', mb: -0.5 }}>
                Dashboard
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748B' }}>
                Vista y analisis
              </Typography>
            </Box>
          </Box>
          
          <IconButton
            sx={{
              width: 48,
              height: 48,
              borderRadius: '12px',
              backgroundColor: '#fff',
              border: '1px solid #E2E8F0',
              color: '#334155',
              transition: 'all 0.2s ease',
              '&:hover': {
                 backgroundColor: '#ef4444',
                 color: '#FFF'
              }
            }}
          >
            <Power size={24} />
          </IconButton>
        </Box>

        {/* Main Content */}
        <Box component="main" sx={{ flexGrow: 1 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardLayout;
