'use client';

import React from 'react';
import { Box, Tooltip, IconButton, useMediaQuery, useTheme } from '@mui/material';
import { 
  LayoutDashboard, 
  Monitor, 
  FileText, 
  Settings,
  Power,
  UserPlus
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    router.replace('/login');
  };

  return (
    <Box
      sx={{
        width: { xs: '100%', md: 80 },
        height: { xs: 64, md: '100vh' },
        backgroundColor: '#FFFFFF',
        borderRight: { xs: 'none', md: '1px solid #E2E8F0' },
        borderBottom: { xs: '1px solid #E2E8F0', md: 'none' },
        display: 'flex',
        flexDirection: { xs: 'row', md: 'column' },
        alignItems: 'center',
        justifyContent: { xs: 'space-between', md: 'flex-start' },
        py: { xs: 0, md: 4 },
        px: { xs: 2, md: 0 },
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 1201,
      }}
    >
      {/* Logout at top (Desktop) or Left (Mobile) */}
      <Box sx={{ order: { xs: 1, md: 0 }, mb: { xs: 0, md: 4 }, ml: { xs: 1, md: 0 } }}>
        <Tooltip title="Cerrar Sesión" placement="right">
          <IconButton
            onClick={handleLogout}
            sx={{
              width: 44,
              height: 44,
              borderRadius: '12px',
              color: '#64748B',
              '&:hover': { color: '#EF4444', backgroundColor: '#FEF2F2' }
            }}
          >
            <Power size={22} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Main Items - Centered */}
      <Box sx={{ 
        order: { xs: 2, md: 0 },
        display: 'flex', 
        flexDirection: { xs: 'row', md: 'column' }, 
        gap: { xs: 1, sm: 2, md: 5 }, 
        flex: { md: 1 }, 
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        {menuItems.map((item) => {
          const isActive = pathname.startsWith(item.path);
          return (
            <Tooltip key={item.id} title={item.label} placement={isMobile ? "bottom" : "right"}>
              <IconButton
                onClick={() => handleNavigate(item.path)}
                sx={{
                  width: { xs: 44, md: 52 },
                  height: { xs: 44, md: 52 },
                  borderRadius: '12px',
                  backgroundColor: isActive ? '#4F8CFF' : 'transparent',
                  color: isActive ? '#FFFFFF' : '#64748B',
                  boxShadow: isActive ? '0 8px 12px -3px rgba(79, 140, 255, 0.4)' : 'none',
                  '&:hover': {
                    backgroundColor: isActive ? '#4F8CFF' : '#F1F5F9',
                  },
                }}
              >
                <item.icon size={isActive ? 24 : 22} />
              </IconButton>
            </Tooltip>
          );
        })}
      </Box>

      {/* Settings & Profile Section */}
      <Box sx={{ 
        order: { xs: 3, md: 0 },
        mt: { xs: 0, md: 'auto' }, 
        display: 'flex', 
        flexDirection: { xs: 'row', md: 'column' }, 
        alignItems: 'center', 
        gap: 1.5,
        mr: { xs: 1, md: 0 }
      }}>
        <Tooltip title="Configuración" placement="right">
          <IconButton
            onClick={() => handleNavigate('/settings')}
            sx={{
              width: 44,
              height: 44,
              borderRadius: '12px',
              backgroundColor: pathname.startsWith('/settings') ? '#4F8CFF' : 'transparent',
              color: pathname.startsWith('/settings') ? '#FFFFFF' : '#64748B',
              boxShadow: pathname.startsWith('/settings') ? '0 8px 12px -3px rgba(79, 140, 255, 0.4)' : 'none',
              '&:hover': { backgroundColor: pathname.startsWith('/settings') ? '#4F8CFF' : '#F1F5F9' }
            }}
          >
            <Settings size={22} />
          </IconButton>
        </Tooltip>

        <Box
          sx={{
            width: { xs: 36, md: 48 },
            height: { xs: 36, md: 48 },
            borderRadius: '10px',
            border: '2px solid #F1F5F9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            backgroundColor: '#FFF',
            '&:hover': { borderColor: '#4F8CFF', transform: 'scale(1.05)' }
          }}
        >
           <Box sx={{ fontSize: { xs: '14px', md: '18px' }, fontWeight: 800, color: '#4F8CFF' }}>M</Box>
        </Box>
      </Box>
    </Box>
  );
};

export default SideNav;
