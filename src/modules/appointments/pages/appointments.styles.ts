import { SxProps, Theme } from '@mui/material';

export const pageWrapperStyles: SxProps<Theme> = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-start',
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
  width: { xs: '100%', sm: 460 },
  p: 4,
  display: 'flex',
  flexDirection: 'column',
  gap: 3
};

export const detailCardStyles: SxProps<Theme> = {
  borderRadius: '18px',
  border: '1px solid #E2E8F0',
  backgroundColor: '#F8FAFC',
  p: 3,
  overflow: 'visible',
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  minHeight: 'fit-content',
  flexShrink: 0,
  width: '100%',
  '& .MuiTypography-root': {
    overflowWrap: 'anywhere',
    wordBreak: 'break-word',
    whiteSpace: 'normal',
  }
};

export const detailTitleStyles: SxProps<Theme> = {
  fontWeight: 800,
  color: '#1E293B',
  fontSize: '15px',
  lineHeight: 1.4,
  mb: 0.5,
};

export const detailLabelStyles: SxProps<Theme> = {
  color: '#64748B',
  fontWeight: 700,
  fontSize: '11px',
  mb: 0.4,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

export const detailValueStyles: SxProps<Theme> = {
  color: '#334155',
  fontWeight: 700,
  fontSize: '13px',
  lineHeight: 1.5,
  maxWidth: '100%',
};

export const formFieldsWrapStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  '& .MuiFormControl-root': {
    width: '100%',
  },
};
