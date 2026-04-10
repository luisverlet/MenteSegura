import { SxProps, Theme } from '@mui/material';

export const containerStyles: SxProps<Theme> = {
  mb: { xs: 2, md: 4 }
};

export const filterBoxStyles: SxProps<Theme> = {
  display: 'flex', 
  justifyContent: 'flex-end', 
  mb: { xs: 2, md: 3 }
};

export const chartCardStyles: SxProps<Theme> = {
  p: { xs: 2.5, md: 4 }, 
  height: '100%', 
  border: '1px solid #E2E8F0', 
  borderRadius: '24px',
  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
};

export const pieChartContainerStyles: SxProps<Theme> = {
  height: { xs: 450, md: 300 }, 
  position: 'relative',
  display: 'flex',
  flexDirection: 'column'
};

export const barChartContainerStyles: SxProps<Theme> = {
  height: { xs: 250, md: 300 }
};

export const legendContainerStyles: SxProps<Theme> = {
  position: { xs: 'static', md: 'absolute' }, 
  right: { md: 20 }, 
  top: { md: '50%' }, 
  transform: { md: 'translateY(-50%)' }, 
  display: 'flex', 
  flexDirection: 'column', 
  gap: 1.5,
  mt: { xs: 3, md: 0 },
  px: { xs: 2, md: 0 }
};

export const legendItemStyles: SxProps<Theme> = {
  display: 'flex', 
  alignItems: 'center', 
  justifyContent: 'space-between', 
  gap: 2, 
  minWidth: { xs: '100%', md: 150 }
};
