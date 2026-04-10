'use client';

import React from 'react';
import { 
  Box, 
  TextField, 
  InputAdornment, 
  IconButton, 
  Popover,
  Typography,
  Button,
  Grid
} from '@mui/material';
import { Search, ListFilter, X } from 'lucide-react';

interface GenericFilterProps {
  onSearch: (value: string) => void;
  onFilterClick?: () => void;
  placeholder?: string;
  children?: React.ReactNode; // For popover content if needed
}

const GenericFilter: React.FC<GenericFilterProps> = ({ 
  onSearch, 
  onFilterClick, 
  placeholder = "Buscar...",
  children 
}) => {
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
    if (onFilterClick) onFilterClick();
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'filter-popover' : undefined;

  return (
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 4 }}>
      <TextField
        placeholder={placeholder}
        onChange={(e) => onSearch(e.target.value)}
        sx={{
          backgroundColor: '#FFF',
          maxWidth: 400,
          '& .MuiOutlinedInput-root': {
            borderRadius: '12px',
          }
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search size={20} color="#64748B" />
            </InputAdornment>
          ),
        }}
      />
      
      {children ? (
        <>
          <IconButton
            onClick={handleClick}
            sx={{
              backgroundColor: '#FFF',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              p: 1.5,
              '&:hover': { backgroundColor: '#F1F5F9' }
            }}
          >
            <ListFilter size={24} color="#1E293B" />
          </IconButton>
          
          <Popover
            id={id}
            open={open}
            anchorEl={anchorEl}
            onClose={handleClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            PaperProps={{
              sx: {
                mt: 1,
                p: 3,
                width: 320,
                borderRadius: '16px',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)'
              }
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Filtros</Typography>
              <IconButton size="small" onClick={handleClose}><X size={18} /></IconButton>
            </Box>
            {children}
          </Popover>
        </>
      ) : (
        <IconButton
            onClick={onFilterClick}
            sx={{
              backgroundColor: '#FFF',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              p: 1.5,
              '&:hover': { backgroundColor: '#F1F5F9' }
            }}
          >
            <ListFilter size={24} color="#1E293B" />
          </IconButton>
      )}
    </Box>
  );
};

export default GenericFilter;
