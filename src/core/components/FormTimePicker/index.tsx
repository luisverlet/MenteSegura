'use client';

import React from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { Box } from '@mui/material';
import { Dayjs } from 'dayjs';

interface FormTimePickerProps {
  label: string;
  value: Dayjs | null;
  onChange: (value: Dayjs | null) => void;
  error?: string;
  required?: boolean;
}

const FormTimePicker: React.FC<FormTimePickerProps> = ({
  label,
  value,
  onChange,
  error,
  required = false,
}) => {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ width: '100%' }}>
        <TimePicker
          label={`${label}${required ? ' *' : ''}`}
          ampm={false}
          value={value}
          onChange={onChange}
          sx={{
            width: '100%',
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
              backgroundColor: '#FFF',
            },
            '& .MuiInputBase-input': {
              textAlign: 'center',
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

export default FormTimePicker;
