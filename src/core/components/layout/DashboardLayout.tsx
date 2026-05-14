'use client';

import React from 'react';
import { Box, Typography, IconButton, useMediaQuery, useTheme, Breadcrumbs, Link as MuiLink } from '@mui/material';
import SideNav from './SideNav';
import { ListFilter, LucideIcon, ChevronRight } from 'lucide-react';
import { usePathname } from 'next/navigation';
import NextLink from 'next/link';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  Icon?: LucideIcon;
  onRightActionClick?: () => void;
}

const pathMapping: Record<string, string> = {
  dashboard: 'Tablero',
  monitoring: 'Monitoreo',
  reports: 'Reportes',
  settings: 'Configuración',
  'dev-register': 'Registro Dev',
};

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  children, 
  title, 
  subtitle, 
  Icon,
  onRightActionClick
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const pathname = usePathname() || '';
  
  const pathSegments = pathname.split('/').filter(p => p);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'transparent', flexDirection: { xs: 'column', md: 'row' } }}>
      <SideNav />
      
      <Box sx={{ 
        flex: 1, 
        ml: { xs: 0, md: '80px' }, 
        mt: { xs: '64px', md: 0 },
        p: { xs: 2.5, md: 4 }, 
        display: 'flex', 
        flexDirection: 'column' 
      }}>
        {/* Breadcrumbs */}
        <Box sx={{ mb: 2 }}>
          <Breadcrumbs separator={<ChevronRight size={14} color="#94A3B8" />} aria-label="breadcrumb">
            <MuiLink component={NextLink} href="/dashboard" underline="hover" sx={{ color: '#64748B', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
              Inicio
            </MuiLink>
            {pathSegments.map((segment, index) => {
              const isLast = index === pathSegments.length - 1;
              const href = `/${pathSegments.slice(0, index + 1).join('/')}`;
              // Si el segmento es un número o id largo, podríamos decir "Detalle", si no, mapear
              const label = pathMapping[segment] || (segment.length > 10 || !isNaN(Number(segment)) ? 'Detalle' : segment.charAt(0).toUpperCase() + segment.slice(1));
              
              return isLast ? (
                <Typography key={href} sx={{ color: '#1E293B', fontSize: '13px', fontWeight: 800 }}>
                  {label}
                </Typography>
              ) : (
                <MuiLink key={href} component={NextLink} href={href} underline="hover" sx={{ color: '#64748B', fontSize: '13px', fontWeight: 600 }}>
                  {label}
                </MuiLink>
              );
            })}
          </Breadcrumbs>
        </Box>

        {/* Header Section */}
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: { xs: 3, md: 5 }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, md: 2 } }}>
            <Box 
              sx={{ 
                width: { xs: 44, md: 52 }, 
                height: { xs: 44, md: 52 }, 
                backgroundColor: '#4F8CFF', 
                borderRadius: '12px', 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                color: '#FFF',
                boxShadow: '0 8px 12px -3px rgba(79, 140, 255, 0.25)'
              }}
            >
              {Icon ? <Icon size={22} /> : (
                <Box sx={{ fontSize: '20px', fontWeight: 'bold' }}>
                  {title.charAt(0)}
                </Box>
              )}
            </Box>
            <Box>
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 800, 
                  color: '#1E293B', 
                  mb: -0.5,
                  fontSize: { xs: '1.2rem', md: '1.6rem' }
                }}
              >
                {title}
              </Typography>
              {subtitle && (
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: '#64748B', 
                    fontWeight: 700,
                    display: { xs: 'none', sm: 'block' },
                    fontSize: '13px'
                  }}
                >
                  {subtitle}
                </Typography>
              )}
            </Box>
          </Box>
          
          {onRightActionClick && isMobile && (
             <IconButton
                onClick={onRightActionClick}
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '12px',
                  backgroundColor: '#fff',
                  border: '1px solid #E2E8F0',
                  color: '#4F8CFF',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                }}
              >
                <ListFilter size={22} />
              </IconButton>
          )}
        </Box>

        {/* Main Content */}
        <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          {children}
        </Box>

        {/* Global Footer Message */}
        <Box sx={{ mt: 'auto', pt: 6, pb: 3, textAlign: 'center' }}>
          <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600, fontSize: { xs: '9px', md: '11px' }, px: 2, display: 'block' }}>
            Todos los datos aquí registrados únicamente pueden ser visualizados por el personal competente de la universidad de Santander.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardLayout;
