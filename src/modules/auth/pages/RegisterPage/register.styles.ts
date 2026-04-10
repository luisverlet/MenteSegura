import { SxProps, Theme } from '@mui/material';

export const pageWrapperStyles: SxProps<Theme> = {
  minHeight: '100vh', 
  display: 'flex', 
  alignItems: 'center', 
  justifyContent: 'center', 
  backgroundColor: 'transparent',
  p: 2
};

export const registerCardStyles: SxProps<Theme> = {
  display: 'flex', 
  width: '100%', 
  maxWidth: 1300, 
  minHeight: 800, 
  gap: 12, 
  overflow: 'visible', 
  boxShadow: 'none',
  border: 'none',
  backgroundColor: 'transparent',
  flexDirection: { xs: 'column-reverse', md: 'row' },
  alignItems: 'center',
  justifyContent: 'center'
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

export const illustrationPanelStyles: SxProps<Theme> = {
  flex: 1, 
  display: { xs: 'none', md: 'flex' }, 
  justifyContent: 'center', 
  alignItems: 'center',
  p: 6
};

export const illustrationBoxStyles: SxProps<Theme> = {
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

export const iconBoxStyles: SxProps<Theme> = {
  p: 1.5, 
  color: '#64748B',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

export const buttonStyles: SxProps<Theme> = {
  height: 56, 
  borderRadius: '12px', 
  fontSize: '16px', 
  fontWeight: 700, 
  textTransform: 'none',
  boxShadow: 'none'
};

export const stepTitleStyles: SxProps<Theme> = {
  fontWeight: 800, 
  textAlign: 'center', 
  mb: 6, 
  color: '#1E293B'
};
