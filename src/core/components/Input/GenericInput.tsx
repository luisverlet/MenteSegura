'use client';

import React from 'react';
import { TextField, TextFieldProps, Typography, Box } from '@mui/material';

type GenericInputProps = TextFieldProps & {
  labelTitle?: string;
  labelColor?: string;
};

const GenericInput: React.FC<GenericInputProps> = ({ 
  labelTitle, 
  labelColor = '#64748B', 
  sx, 
  ...props 
}) => {
  return (
    <Box sx={{ width: '100%' }}>
      {labelTitle && (
        <Typography 
          variant="subtitle2" 
          sx={{ 
            fontWeight: 700, 
            mb: 1, 
            color: labelColor,
            fontSize: '13px',
            display: 'block'
          }}
        >
          {labelTitle}
        </Typography>
      )}
      <TextField
        fullWidth
        {...props}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: '12px',
            backgroundColor: '#FFF',
            '& fieldset': {
              borderColor: '#E2E8F0',
            },
            '&:hover fieldset': {
              borderColor: '#4F8CFF',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#4F8CFF',
            },
          },
          '& .MuiInputBase-input': {
            py: 1.5,
            fontSize: '14px',
            fontWeight: 500
          },
          ...sx
        }}
      />
    </Box>
  );
};

export default GenericInput;
