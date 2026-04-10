import { SxProps, Theme } from '@mui/material';

export const containerStyles: SxProps<Theme> = {
  mb: 4
};

export const filterBoxStyles: SxProps<Theme> = {
  display: 'flex', 
  justifyContent: 'flex-end', 
  mb: 3
};

export const chartCardStyles: SxProps<Theme> = {
  p: 4, 
  height: '100%', 
  border: '1px solid #E2E8F0', 
  borderRadius: '16px'
};

export const pieChartContainerStyles: SxProps<Theme> = {
  height: 300, 
  position: 'relative'
};

export const barChartContainerStyles: SxProps<Theme> = {
  height: 300
};

export const legendContainerStyles: SxProps<Theme> = {
  position: 'absolute', 
  right: 20, 
  top: '50%', 
  transform: 'translateY(-50%)', 
  display: 'flex', 
  flexDirection: 'column', 
  gap: 2
};

export const legendItemStyles: SxProps<Theme> = {
  display: 'flex', 
  alignItems: 'center', 
  justifyContent: 'space-between', 
  gap: 4, 
  minWidth: 150
};
