'use client';

import React from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Box } from '@mui/material';
import { Dayjs } from 'dayjs';

interface FormDatePickerProps {
  label: string;
  value: Dayjs | null;
  onChange: (value: Dayjs | null) => void;
  error?: string;
  required?: boolean;
}

const FormDatePicker: React.FC<FormDatePickerProps> = ({
  label,
  value,
  onChange,
  error,
  required = false
}) => {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ width: '100%' }}>
        <DatePicker
          label={`${label}${required ? ' *' : ''}`}
          value={value}
          onChange={onChange}
          sx={{
            width: '100%',
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
              backgroundColor: '#FFF',
            },
          }}
          slotProps={{
            textField: {
              error: !!error,
              helperText: error,
              fullWidth: true,
              variant: 'outlined',
            },
          }}
        />
      </Box>
    </LocalizationProvider>
  );
};

export default FormDatePicker;
