import { SxProps, Theme } from '@mui/material';

export const pageWrapperStyles: SxProps<Theme> = {
  minHeight: '100vh', 
  display: 'flex', 
  alignItems: 'center', 
  justifyContent: 'center', 
  backgroundColor: 'transparent',
  p: 2
};

export const loginCardStyles: SxProps<Theme> = {
  display: 'flex', 
  width: '100%', 
  maxWidth: 1300, 
  minHeight: 800, 
  gap: 12, 
  overflow: 'visible', 
  border: 'none',
  backgroundColor: 'transparent',
  boxShadow: 'none',
  flexDirection: { xs: 'column-reverse', md: 'row' },
  alignItems: 'center',
  justifyContent: 'center'
};

export const illustrationPanelStyles: SxProps<Theme> = {
  flex: 1, 
  display: { xs: 'none', md: 'flex' }, 
  justifyContent: 'center', 
  alignItems: 'center',
  p: 6
};

export const illustrationPlaceholderStyles: SxProps<Theme> = {
  width: '100%', 
  height: '100%', 
  backgroundColor: '#FFF', 
  borderRadius: '24px', 
  display: 'flex', 
  flexDirection: 'column',
  justifyContent: 'center', 
  alignItems: 'center',
  border: '2px dashed #E2E8F0',
  textAlign: 'center'
};

export const formPanelStyles: SxProps<Theme> = {
  width: { xs: '100%', md: '550px' }, 
  p: { xs: 4, md: 10 }, 
  display: 'flex', 
  flexDirection: 'column', 
  justifyContent: 'center',
  backgroundColor: '#FFF',
  borderRadius: '32px',
  boxShadow: '0 20px 40px rgba(0,0,0,0.05)'
};

export const iconBoxStyles: SxProps<Theme> = {
  p: 1, 
  color: '#64748B',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

export const loginButtonStyles: SxProps<Theme> = {
  height: 56, 
  borderRadius: '12px', 
  fontSize: '16px', 
  fontWeight: 700, 
  backgroundColor: '#4F8CFF',
  textTransform: 'none',
  mb: 4,
  boxShadow: 'none'
};

export const loadingBackdropStyles: SxProps<Theme> = {
  zIndex: 1400,
  backdropFilter: 'blur(10px)',
  backgroundColor: 'rgba(243, 247, 255, 0.82)',
};

export const loadingCardStyles: SxProps<Theme> = {
  width: 'min(92vw, 420px)',
  p: { xs: 4, md: 5 },
  borderRadius: '28px',
  backgroundColor: '#FFF',
  boxShadow: '0 24px 60px rgba(15, 23, 42, 0.12)',
  textAlign: 'center'
};

export const loadingSpinnerWrapStyles: SxProps<Theme> = {
  width: 82,
  height: 82,
  borderRadius: '24px',
  background: 'linear-gradient(135deg, rgba(79, 140, 255, 0.12), rgba(59, 130, 246, 0.22))',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  mx: 'auto',
  mb: 3
};
