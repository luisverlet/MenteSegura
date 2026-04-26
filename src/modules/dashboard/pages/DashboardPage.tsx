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

import { LayoutDashboard } from 'lucide-react';
import { fetchWithRetry } from '@/core/utils/network';

// ...
const DashboardPage = () => {
  const [stats, setStats] = React.useState({ students: 0, users: 0, activeUsers: 0 });
  const [pieData, setPieData] = React.useState<any[]>([
    { name: 'Bajo', value: 0, color: '#1E293B' },
    { name: 'Moderado', value: 0, color: '#4F8CFF' },
    { name: 'Alto', value: 0, color: '#FDBA74' },
  ]);
  const [barData, setBarData] = React.useState<any[]>([]);

  const [programs, setPrograms] = React.useState<any[]>([]);
  const [selectedProgram, setSelectedProgram] = React.useState<string>('default');

  const [selectedPeriod, setSelectedPeriod] = React.useState<string>('Mes');

  React.useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem('auth_token');
      try {
        const statsUrl = selectedProgram !== 'default' 
          ? `/api/proxy/dashboard/stats?program_id=${selectedProgram}&period=${selectedPeriod}` 
          : `/api/proxy/dashboard/stats?period=${selectedPeriod}`;

        const [studentsRes, usersRes, statsRes, programsRes] = await Promise.all([
          fetchWithRetry('/api/proxy/students', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetchWithRetry('/api/proxy/users', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetchWithRetry(statsUrl, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetchWithRetry('/api/proxy/programs', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (programsRes.ok) {
          const progData = await programsRes.json();
          setPrograms(Array.isArray(progData) ? progData : (progData.items || []));
        }

        let studentsCount = 0;
        let usersCount = 0;
        let activeCount = 0;

        if (studentsRes.ok) {
          const data = await studentsRes.json();
          const studentsList = Array.isArray(data) ? data : (data.items || []);
          const filteredStudents = selectedProgram !== 'default' 
            ? studentsList.filter((s: any[]) => String(s[4]) === selectedProgram)
            : studentsList;
          studentsCount = filteredStudents.length;
        }
        if (usersRes.ok) {
          const users = await usersRes.json();
          usersCount = users.length;
          activeCount = users.filter((u: any[]) => u[5] === 'activo').length;
        }

        setStats({ students: studentsCount, users: usersCount, activeUsers: activeCount });

        if (statsRes.ok) {
          const dashboardStats = await statsRes.json();
          const riskDist = dashboardStats.risk_distribution || {};
          
          const totalRisks = (riskDist.riesgo_bajo || 0) + (riskDist.riesgo_medio || 0) + (riskDist.riesgo_alto || 0);
          
          setPieData([
            { name: 'Bajo', value: totalRisks > 0 ? Math.round(((riskDist.riesgo_bajo || 0) / totalRisks) * 100) : 0, color: '#1E293B' },
            { name: 'Moderado', value: totalRisks > 0 ? Math.round(((riskDist.riesgo_medio || 0) / totalRisks) * 100) : 0, color: '#4F8CFF' },
            { name: 'Alto', value: totalRisks > 0 ? Math.round(((riskDist.riesgo_alto || 0) / totalRisks) * 100) : 0, color: '#FDBA74' },
          ]);

          const evolution = dashboardStats.monthly_evolution || [];
          const formattedBarData = evolution.map((item: any) => ({
            name: item.mes,
            value: item.riesgo_promedio || 0,
            value2: item.puntaje_promedio || 0
          }));

          let finalBarData = formattedBarData;
          if (selectedPeriod === 'Trimestre' && formattedBarData.length > 0) {
            const trimesters = [];
            for (let i = 0; i < formattedBarData.length; i += 3) {
              const chunk = formattedBarData.slice(i, i + 3);
              const avgValue = chunk.reduce((acc: number, c: any) => acc + c.value, 0) / chunk.length;
              const avgValue2 = chunk.reduce((acc: number, c: any) => acc + c.value2, 0) / chunk.length;
              trimesters.push({
                name: `Trimestre ${Math.floor(i / 3) + 1}`,
                value: Number(avgValue.toFixed(1)),
                value2: Number(avgValue2.toFixed(1))
              });
            }
            finalBarData = trimesters;
          }

          setBarData(finalBarData.length > 0 ? finalBarData : [
            { name: 'Sin datos', value: 0, value2: 0 }
          ]);
        }
      } catch (e) {
        console.error('Error fetching dashboard stats', e);
      }
    };
    fetchStats();
  }, [selectedProgram, selectedPeriod]);

  return (
    <DashboardLayout 
      title="Dashboard" 
      subtitle="Vista y analisis" 
      Icon={LayoutDashboard}
    >
      {/* Top Filter */}
      <Box sx={styles.filterBoxStyles}>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <Select 
            value={selectedPeriod} 
            onChange={(e) => setSelectedPeriod(e.target.value)} 
            variant="outlined" 
            sx={{ borderRadius: '8px' }}
          >
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
            value={(stats?.students ?? 0).toString()} 
            bgColor="#4F8CFF" 
            textColor="#FFF"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <StatCard 
            title="Usuarios registrados" 
            value={(stats?.users ?? 0).toString()} 
            bgColor="#22C55E" 
            textColor="#FFF"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <StatCard 
            title="Usuarios activos" 
            value={(stats?.activeUsers ?? 0).toString()} 
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: { xs: 2.5, md: 4 }, flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, fontSize: { xs: '1rem', md: '1.25rem' } }}>Distribucion de niveles de riesgo</Typography>
              <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', fontSize: '10px' }}>Programa academico</Typography>
                <Select 
                  size="small" 
                  value={selectedProgram}
                  onChange={(e) => setSelectedProgram(e.target.value)}
                  sx={{ borderRadius: '8px', mt: 0.5, height: { xs: 32, md: 36 }, fontSize: '12px', minWidth: 220 }}
                >
                  <MenuItem value="default">Todos los programas</MenuItem>
                  {programs.map((p: any[]) => (
                    <MenuItem key={p[0]} value={String(p[0])}>{p[1]}</MenuItem>
                  ))}
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
             <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: { xs: 2.5, md: 4 } }}>
               <Typography variant="h6" sx={{ fontWeight: 800, fontSize: { xs: '1rem', md: '1.25rem' } }}>Evaluaciones realizadas</Typography>
               <Select 
                  size="small" 
                  value={selectedProgram}
                  onChange={(e) => setSelectedProgram(e.target.value)}
                  sx={{ borderRadius: '8px', height: { xs: 32, md: 36 }, fontSize: '12px', minWidth: 220 }}
                >
                  <MenuItem value="default">Todos los programas</MenuItem>
                  {programs.map((p: any[]) => (
                    <MenuItem key={p[0]} value={String(p[0])}>{p[1]}</MenuItem>
                  ))}
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
