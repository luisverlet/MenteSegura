'use client';

import React from 'react';
import { 
  Box, 
  Grid, 
  Typography, 
  Select, 
  MenuItem, 
  Card, 
  FormControl 
} from '@mui/material';
import DashboardLayout from '@/core/components/layout/DashboardLayout';
import StatCard from '@/core/components/Cards/StatCard';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import * as styles from './dashboard.styles';

const barData = [
  { name: 'Enero', value: 65, value2: 90 },
  { name: 'Febrero', value: 55, value2: 75 },
  { name: 'Marzo', value: 30, value2: 35 },
  { name: 'Abril', value: 38, value2: 45 },
  { name: 'Mayo', value: 20, value2: 25 },
  { name: 'Junio', value: 75, value2: 60 },
  { name: 'Julio', value: 50, value2: 65 },
];

const pieData = [
  { name: 'Bajo', value: 10, color: '#1E293B' },
  { name: 'Moderado', value: 60, color: '#4F8CFF' },
  { name: 'Alto', value: 30, color: '#FDBA74' },
];

const DashboardPage = () => {
  return (
    <DashboardLayout>
      {/* Top Filter */}
      <Box sx={styles.filterBoxStyles}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <Select defaultValue="Mes" variant="outlined" sx={{ borderRadius: '8px' }}>
            <MenuItem value="Mes">Mes</MenuItem>
            <MenuItem value="Trimestre">Trimestre</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Counters Grid */}
      <Grid container spacing={3} sx={styles.containerStyles}>
        <Grid size={{ xs: 12, md: 4 }}>
          <StatCard 
            title="Total de estudiantes" 
            value="120" 
            bgColor="#4F8CFF" 
            textColor="#FFF"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <StatCard 
            title="Encuestas completadas" 
            value="112" 
            bgColor="#22C55E" 
            textColor="#FFF"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <StatCard 
            title="Usuarios activos" 
            value="25" 
            bgColor="#EF4444" 
            textColor="#FFF"
          />
        </Grid>
      </Grid>

      {/* Charts Grid */}
      <Grid container spacing={4}>
        {/* Left Chart: Risk Levels */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={styles.chartCardStyles}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>Distribucion de niveles de riesgo</Typography>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>Programa academico</Typography>
                <Select size="small" defaultValue="default" sx={{ borderRadius: '8px', mt: 0.5 }}>
                  <MenuItem value="default">Programa academico</MenuItem>
                </Select>
              </Box>
            </Box>
            
            <Box sx={styles.pieChartContainerStyles}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="30%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              
              {/* Legend manually placed */}
              <Box sx={styles.legendContainerStyles}>
                {pieData.map((item) => (
                  <Box key={item.name} sx={styles.legendItemStyles}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{ width: 14, height: 14, borderRadius: '4px', backgroundColor: item.color }} />
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{item.name}</Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>{item.value}%</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Card>
        </Grid>

        {/* Right Chart: Evaluations */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Card sx={styles.chartCardStyles}>
             <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
               <Typography variant="h6" sx={{ fontWeight: 800 }}>Evaluaciones realizadas</Typography>
               <Select size="small" defaultValue="default" sx={{ borderRadius: '8px' }}>
                  <MenuItem value="default">Programa academico</MenuItem>
                </Select>
             </Box>
             
             <Box sx={styles.barChartContainerStyles}>
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={barData} barGap={8}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fontWeight: 700 }}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fontWeight: 700 }}
                    />
                    <Tooltip cursor={{ fill: 'rgba(79,140,255,0.05)' }} />
                    <Bar 
                      dataKey="value" 
                      fill="#4F8CFF" 
                      radius={[4, 4, 0, 0]} 
                      barSize={20}
                    />
                    <Bar 
                      dataKey="value2" 
                      fill="#8B5CF6" 
                      radius={[4, 4, 0, 0]} 
                      barSize={20}
                    />
                 </BarChart>
               </ResponsiveContainer>
             </Box>
          </Card>
        </Grid>
      </Grid>
    </DashboardLayout>
  );
};

export default DashboardPage;
