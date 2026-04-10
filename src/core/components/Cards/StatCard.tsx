'use client';

import React from 'react';
import { Box, Typography, Card, Skeleton } from '@mui/material';

interface StatCardProps {
  title: string;
  value: string | number;
  bgColor?: string;
  textColor?: string;
  isLoading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  bgColor = '#FFFFFF', 
  textColor = '#FFF', 
  isLoading = false 
}) => {
  return (
    <Card 
      sx={{ 
        flex: 1, 
        height: '100%',
        minHeight: { xs: 100, md: 120 }, 
        backgroundColor: bgColor, 
        borderRadius: '20px', 
        p: { xs: 2, md: 3 }, 
        border: 'none', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
           transform: 'translateY(-2px)',
           boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
        }
      }}
    >
      {isLoading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Skeleton variant="text" width="50%" />
          <Skeleton variant="text" width="30%" height={30} />
        </Box>
      ) : (
        <>
          <Typography 
            variant="caption" 
            sx={{ 
              fontWeight: 700, 
              color: textColor, 
              opacity: 0.8, 
              mb: 0.5,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontSize: { xs: '10px', md: '11px' }
            }}
          >
            {title}
          </Typography>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 800, 
              color: textColor, 
              fontSize: { xs: '1.5rem', md: '2rem' },
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

export default StatCard;
