import { SxProps, Theme } from '@mui/material';

export const detailCardStyles: SxProps<Theme> = {
  maxWidth: 950,
  width: '100%',
  backgroundColor: '#FFF',
  borderRadius: '24px',
  p: { xs: 4, md: 6 },
  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
  mx: 'auto',
  overflow: 'hidden',
  display: 'block'
};

export const labelStyles: SxProps<Theme> = {
  fontWeight: 800,
  fontSize: '15px',
  color: '#1E293B',
  mb: 0.2
};

export const valueStyles: SxProps<Theme> = {
  fontWeight: 500,
  fontSize: '14px',
  color: '#94A3B8',
  mb: 2.5
};

export const scoreLabelStyles: SxProps<Theme> = {
  fontWeight: 800,
  fontSize: '18px',
  color: '#1E293B'
};

export const scoreValueStyles: SxProps<Theme> = {
  fontWeight: 600,
  fontSize: '14px',
  color: '#94A3B8',
  mt: 0.5
};

export const historyButtonStyles: SxProps<Theme> = {
  backgroundColor: '#4F8CFF',
  color: '#FFF',
  borderRadius: '10px',
  px: 4,
  py: 1.2,
  fontWeight: 800,
  textTransform: 'none',
  fontSize: '14px',
  boxShadow: '0 4px 6px -1px rgba(79, 140, 255, 0.2)',
  '&:hover': {
     backgroundColor: '#3b82f6'
  }
};

export const areaChartContainerStyles: SxProps<Theme> = {
  height: 180,
  width: '100%',
  border: '1px solid #E2E8F0',
  borderRadius: '16px',
  p: 2,
  mt: 1,
  backgroundColor: '#FFF'
};
