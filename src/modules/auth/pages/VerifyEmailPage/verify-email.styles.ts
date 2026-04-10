import { SxProps, Theme } from '@mui/material';

export const pageWrapperStyles: SxProps<Theme> = {
  minHeight: '100vh', 
  display: 'flex', 
  alignItems: 'center', 
  justifyContent: 'center', 
  backgroundColor: '#F3F7FF',
  p: 2
};

export const verifyCardStyles: SxProps<Theme> = {
  width: '100%', 
  maxWidth: 800, 
  minHeight: 500, 
  borderRadius: '32px', 
  p: { xs: 4, md: 8 },
  display: 'flex', 
  flexDirection: 'column', 
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#FFF',
  boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
  textAlign: 'center'
};

export const codeInputContainerStyles: SxProps<Theme> = {
  display: 'flex',
  justifyContent: 'center',
  gap: 2,
  my: 6
};

export const codeBoxStyles: SxProps<Theme> = {
  width: { xs: 45, md: 60 },
  height: { xs: 55, md: 70 },
  backgroundColor: '#F3F4F6',
  borderRadius: '8px',
  border: '1px solid #E5E7EB',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '24px',
  fontWeight: 700,
  transition: 'all 0.2s ease',
  '&:focus-within': {
    borderColor: '#4F8CFF',
    backgroundColor: '#FFF',
    boxShadow: '0 0 0 2px rgba(79, 140, 255, 0.1)'
  }
};

export const verifyButtonStyles: SxProps<Theme> = {
  height: 56, 
  width: '100%',
  maxWidth: 400,
  borderRadius: '12px', 
  fontSize: '16px', 
  fontWeight: 700, 
  backgroundColor: '#4F8CFF',
  textTransform: 'none'
};
