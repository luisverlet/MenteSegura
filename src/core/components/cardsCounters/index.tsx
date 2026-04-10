'use client';

import React from 'react';
import { Box, Typography, Card, Skeleton } from '@mui/material';

interface CardCountersProps {
  title: string;
  value: string | number;
  bgColor?: string;
  textColor?: string;
  isLoading?: boolean;
}

const CardCounters: React.FC<CardCountersProps> = ({ 
  title, 
  value, 
  bgColor = '#FFFFFF', 
  textColor = '#FFF', 
  isLoading = false 
}) => {
  // Simple heuristic for dynamic font-size relative to length of value
  const valueStr = String(value);
  const fontSize = valueStr.length > 5 ? '2.5rem' : '3.5rem';

  return (
    <Card 
      sx={{ 
        flex: 1, 
        minHeight: 180, 
        backgroundColor: bgColor, 
        borderRadius: '16px', 
        p: 3, 
        border: 'none', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        textAlign: 'center',
        transition: 'all 0.3s ease',
        '&:hover': {
           transform: 'translateY(-5px)',
           boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
        }
      }}
    >
      {isLoading ? (
        <>
          <Skeleton variant="text" width="60%" sx={{ mb: 1 }} />
          <Skeleton variant="rectangular" width="40%" height={60} sx={{ borderRadius: 1 }} />
        </>
      ) : (
        <>
          <Typography 
            variant="subtitle1" 
            sx={{ 
              fontWeight: 600, 
              color: textColor, 
              opacity: 0.9, 
              mb: 1,
              maxWidth: '80%', 
              lineHeight: 1.2
            }}
          >
            {title}
          </Typography>
          <Typography 
            variant="h2" 
            sx={{ 
              fontWeight: 800, 
              color: textColor, 
              fontSize: { xs: '2.5rem', md: fontSize },
              lineHeight: 1 
            }}
          >
            {value}
          </Typography>
        </>
      )}
    </Card>
  );
};

export default CardCounters;
