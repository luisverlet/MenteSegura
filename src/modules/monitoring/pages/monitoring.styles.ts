import { SxProps, Theme } from '@mui/material';

export const pageWrapperStyles: SxProps<Theme> = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-start', // Starts at top
  position: 'relative'
};

export const tableCardStyles: SxProps<Theme> = {
  width: '100%',
  backgroundColor: 'transparent',
  borderRadius: '24px',
  p: 0,
  overflow: 'hidden',
  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05)',
  border: 'none',
  display: 'flex',
  flexDirection: 'column',
  // Adaptive centering if container is small
  mx: 'auto'
};

export const detailLinkStyles: SxProps<Theme> = {
  color: '#4F8CFF',
  fontWeight: 700,
  textDecoration: 'none',
  fontSize: '14px',
  '&:hover': {
    textDecoration: 'underline'
  }
};

export const drawerPaperStyles: SxProps<Theme> = {
  width: { xs: '100%', sm: 450 },
  p: 4,
  display: 'flex',
  flexDirection: 'column',
  gap: 3
};

export const filterFieldStyles: SxProps<Theme> = {
  '& .MuiTypography-root': {
    fontWeight: 700,
    mb: 1,
    display: 'block'
  }
};
