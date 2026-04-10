'use client';

import React from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TextField, Box, Typography } from '@mui/material';
import dayjs, { Dayjs } from 'dayjs';

interface JookDatePickerProps {
  label: string;
  value: Dayjs | null;
  onChange: (value: Dayjs | null) => void;
  error?: string;
  required?: boolean;
}

const JookDatePicker: React.FC<JookDatePickerProps> = ({
  label,
  value,
  onChange,
  error,
  required = false
}) => {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ width: '100%', mb: 2 }}>
        <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', mb: 1, display: 'block' }}>
          {label} {required && '*'}
        </Typography>
        <DatePicker
          value={value}
          onChange={onChange}
          sx={{
            width: '100%',
            '& .MuiOutlinedInput-root': {
               borderRadius: '12px',
               backgroundColor: '#FFF'
            }
          }}
          slotProps={{
            textField: {
              error: !!error,
              helperText: error,
              fullWidth: true
            }
          }}
        />
      </Box>
    </LocalizationProvider>
  );
};

export default JookDatePicker;
