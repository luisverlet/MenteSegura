'use client';

import React from 'react';
import { Box, Tooltip, IconButton } from '@mui/material';
import { 
  LayoutDashboard, 
  Monitor, 
  FileText, 
  Settings 
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

const menuItems = [
  { id: 'dashboard', icon: LayoutDashboard, path: '/dashboard', label: 'Dashboard' },
  { id: 'monitor', icon: Monitor, path: '/monitoring', label: 'Monitoreo' },
  { id: 'reports', icon: FileText, path: '/reports', label: 'Reportes' },
];

const SideNav = () => {
  const pathname = usePathname();
  const router = useRouter();

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  return (
    <Box
      sx={{
        width: 80,
        height: '100vh',
        backgroundColor: '#FFFFFF',
        borderRight: '1px solid #E2E8F0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        py: 4,
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 1201,
      }}
    >
      {/* Top Section: Settings */}
      <Box sx={{ mb: 4 }}>
        <Tooltip title="Configuración" placement="right">
          <IconButton
            sx={{
              width: 48,
              height: 48,
              borderRadius: '12px',
              color: '#64748B',
              '&:hover': { backgroundColor: '#F1F5F9' }
            }}
          >
            <Settings size={28} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Center Section: Modules */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, justifyContent: 'center' }}>
        {menuItems.map((item) => {
          const isActive = pathname.startsWith(item.path);
          return (
            <Tooltip key={item.id} title={item.label} placement="right">
              <IconButton
                onClick={() => handleNavigate(item.path)}
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: '12px',
                  backgroundColor: isActive ? '#4F8CFF' : 'transparent',
                  color: isActive ? '#FFFFFF' : '#64748B',
                  boxShadow: isActive ? '0 10px 15px -3px rgba(79, 140, 255, 0.4)' : 'none',
                  '&:hover': {
                    backgroundColor: isActive ? '#4F8CFF' : '#F1F5F9',
                  },
                }}
              >
                <item.icon size={26} />
              </IconButton>
            </Tooltip>
          );
        })}
      </Box>

      {/* Bottom Section: Profile/Logo */}
      <Box sx={{ mt: 'auto' }}>
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: '12px',
            border: '2px solid #F1F5F9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            backgroundColor: '#FFF',
            '&:hover': { borderColor: '#4F8CFF', transform: 'scale(1.05)' }
          }}
        >
           <Box sx={{ fontSize: '20px', fontWeight: 800, color: '#4F8CFF' }}>M</Box>
        </Box>
      </Box>
    </Box>
  );
};

export default SideNav;
