'use client';

import React from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  Snackbar,
  Alert,
  Button,
  Drawer,
  IconButton,
  TextField,
  MenuItem,
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
  Cell,
} from 'recharts';
import * as styles from './dashboard.styles';
import { LayoutDashboard, ListFilter, X } from 'lucide-react';
import { fetchWithRetry } from '@/core/utils/network';
import { buildNetworkError, buildRequestError } from '@/core/utils/request-feedback';

const monthOptions = [
  'Todos',
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const defaultFilters = {
  month: 'Todos',
  program: 'default',
};

const normalizePrograms = (data: any) => (Array.isArray(data) ? data : (data.items || []));
const normalizeUsers = (data: any) => (Array.isArray(data) ? data : (data.items || []));
const normalizeStudents = (data: any) => (Array.isArray(data) ? data : (data.items || []));

const buildStatsUrl = (program: string, month: string) => {
  const params = new URLSearchParams();
  params.set('period', 'Mes');

  if (program !== 'default') {
    params.set('program_id', program);
  }

  if (month !== 'Todos') {
    params.set('month', month);
  }

  return `/api/proxy/dashboard/stats?${params.toString()}`;
};

const applyMonthFilter = (evolution: any[], selectedMonth: string) => {
  if (selectedMonth === 'Todos') return evolution;
  return evolution.filter((item) => String(item.mes || '').toLowerCase() === selectedMonth.toLowerCase());
};

const DashboardPage = () => {
  const [stats, setStats] = React.useState({ students: 0, users: 0, activeUsers: 0 });
  const [programs, setPrograms] = React.useState<any[]>([]);
  const [filters, setFilters] = React.useState(defaultFilters);
  const [draftFilters, setDraftFilters] = React.useState(defaultFilters);
  const [isFilterOpen, setIsFilterOpen] = React.useState(false);
  const [pieData, setPieData] = React.useState<any[]>([
    { name: 'Bajo', value: 0, color: '#1E293B' },
    { name: 'Moderado', value: 0, color: '#4F8CFF' },
    { name: 'Alto', value: 0, color: '#FDBA74' },
  ]);
  const [barData, setBarData] = React.useState<any[]>([{ name: 'Sin datos', value: 0, value2: 0 }]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [pageError, setPageError] = React.useState('');
  const [snackbar, setSnackbar] = React.useState<{ open: boolean; message: string; severity: 'error' | 'warning' }>({
    open: false,
    message: '',
    severity: 'error',
  });

  React.useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setPageError('No encontramos una sesión activa para cargar el tablero.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setPageError('');

      const statsUrl = buildStatsUrl(filters.program, filters.month);

      try {
        const [studentsRes, usersRes, statsRes, programsRes] = await Promise.all([
          fetchWithRetry('/api/proxy/students', { headers: { Authorization: `Bearer ${token}` } }),
          fetchWithRetry('/api/proxy/users', { headers: { Authorization: `Bearer ${token}` } }),
          fetchWithRetry(statsUrl, { headers: { Authorization: `Bearer ${token}` } }),
          fetchWithRetry('/api/proxy/programs', { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        const errors: string[] = [];

        if (programsRes.ok) {
          const programsData = await programsRes.json();
          setPrograms(normalizePrograms(programsData));
        } else {
          errors.push(await buildRequestError(programsRes, 'No pudimos cargar los programas académicos.'));
        }

        if (studentsRes.ok) {
          const data = await studentsRes.json();
          const studentsList = normalizeStudents(data);
          setStats((current) => ({ ...current, students: studentsList.length }));
        } else {
          errors.push(await buildRequestError(studentsRes, 'No pudimos cargar el total de estudiantes.'));
        }

        if (usersRes.ok) {
          const usersData = await usersRes.json();
          const users = normalizeUsers(usersData);
          setStats((current) => ({
            ...current,
            users: users.length,
            activeUsers: users.filter((user: any) => (Array.isArray(user) ? user[5] : user?.status) === 'activo').length,
          }));
        } else {
          errors.push(await buildRequestError(usersRes, 'No pudimos cargar la información de usuarios.'));
        }

        if (statsRes.ok) {
          const dashboardStats = await statsRes.json();
          const riskDist = dashboardStats.risk_distribution || {};
          const totalRisks = (riskDist.riesgo_bajo || 0) + (riskDist.riesgo_medio || 0) + (riskDist.riesgo_alto || 0);

          setPieData([
            { name: 'Bajo', value: totalRisks > 0 ? Math.round(((riskDist.riesgo_bajo || 0) / totalRisks) * 100) : 0, color: '#1E293B' },
            { name: 'Moderado', value: totalRisks > 0 ? Math.round(((riskDist.riesgo_medio || 0) / totalRisks) * 100) : 0, color: '#4F8CFF' },
            { name: 'Alto', value: totalRisks > 0 ? Math.round(((riskDist.riesgo_alto || 0) / totalRisks) * 100) : 0, color: '#FDBA74' },
          ]);

          const filteredEvolution = applyMonthFilter(dashboardStats.monthly_evolution || [], filters.month);
          const formattedBarData = filteredEvolution.map((item: any) => ({
            name: item.mes,
            value: item.riesgo_promedio || 0,
            value2: item.puntaje_promedio || 0,
          }));

          setBarData(formattedBarData.length > 0 ? formattedBarData : [{ name: 'Sin datos', value: 0, value2: 0 }]);
        } else {
          errors.push(await buildRequestError(statsRes, 'No pudimos cargar la información filtrada del tablero.'));
        }

        if (errors.length > 0) {
          setPageError(errors[0]);
          if (errors.length > 1) {
            setSnackbar({ open: true, message: errors.slice(1).join(' '), severity: 'warning' });
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard stats', error);
        setPageError(buildNetworkError('la información del tablero'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [filters]);

  const hasActiveFilters = filters.month !== defaultFilters.month || filters.program !== defaultFilters.program;

  const applyFilters = () => {
    setFilters(draftFilters);
    setIsFilterOpen(false);
  };

  const clearFilters = () => {
    setDraftFilters(defaultFilters);
    setFilters(defaultFilters);
    setIsFilterOpen(false);
  };

  return (
    <DashboardLayout
      title="Tablero de Control"
      subtitle="Vista y analisis"
      Icon={LayoutDashboard}
      onRightActionClick={() => setIsFilterOpen(true)}
    >
      <Box sx={styles.filterBoxStyles}>
        <Button
          variant="outlined"
          onClick={() => setIsFilterOpen(true)}
          startIcon={<ListFilter size={20} />}
          sx={{
            backgroundColor: '#fff',
            borderColor: '#E2E8F0',
            color: '#334155',
            borderRadius: '12px',
            px: 3,
            height: 44,
            fontWeight: 700,
            textTransform: 'none',
            '&:hover': { backgroundColor: '#F8FAFC', borderColor: '#4F8CFF' },
          }}
        >
          Filtros {hasActiveFilters && '(activos)'}
        </Button>
      </Box>

      {pageError && (
        <Card sx={{ ...styles.errorCardStyles, mb: 3 }}>
          <Typography sx={{ fontWeight: 800, color: '#B91C1C', mb: 0.7 }}>
            No pudimos cargar completamente el tablero
          </Typography>
          <Typography sx={{ color: '#7F1D1D', fontWeight: 600, fontSize: '14px' }}>
            {pageError}
          </Typography>
        </Card>
      )}

      <Grid container spacing={3} sx={styles.containerStyles}>
        <Grid size={{ xs: 12, md: 4 }}>
          <StatCard title="Total de estudiantes" value={isLoading ? '...' : (stats.students ?? 0).toString()} bgColor="#4F8CFF" textColor="#FFF" />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <StatCard title="Usuarios registrados" value={isLoading ? '...' : (stats.users ?? 0).toString()} bgColor="#22C55E" textColor="#FFF" />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <StatCard title="Usuarios activos" value={isLoading ? '...' : (stats.activeUsers ?? 0).toString()} bgColor="#EF4444" textColor="#FFF" />
        </Grid>
      </Grid>

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={styles.chartCardStyles}>
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: { xs: '1rem', md: '1.25rem' }, mb: { xs: 2.5, md: 4 } }}>
              Distribucion de niveles de riesgo
            </Typography>

            <Box sx={styles.pieChartContainerStyles}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="30%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number | undefined) => [`${value ?? 0}%`, 'Porcentaje de estudiantes']}
                    labelFormatter={(label) => `Nivel: ${label}`}
                  />
                </PieChart>
              </ResponsiveContainer>

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

        <Grid size={{ xs: 12, md: 7 }}>
          <Card sx={styles.chartCardStyles}>
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: { xs: '1rem', md: '1.25rem' }, mb: { xs: 2.5, md: 4 } }}>
              Evaluaciones realizadas
            </Typography>

            <Box sx={styles.barChartContainerStyles}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} barGap={8}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700 }} />
                  <Tooltip
                    cursor={{ fill: 'rgba(79,140,255,0.05)' }}
                    formatter={(value: number | undefined, name: string | undefined) => {
                      if (name === 'value') return [value ?? 0, 'Riesgo promedio'];
                      if (name === 'value2') return [value ?? 0, 'Puntaje promedio'];
                      return [value ?? 0, name ?? 'Valor'];
                    }}
                    labelFormatter={(label) => `Mes: ${label}`}
                  />
                  <Bar dataKey="value" fill="#4F8CFF" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="value2" fill="#8B5CF6" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Card>
        </Grid>
      </Grid>

      <Drawer anchor="right" open={isFilterOpen} onClose={() => setIsFilterOpen(false)} PaperProps={{ sx: styles.drawerPaperStyles }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>Filtros Avanzados</Typography>
          <IconButton onClick={() => setIsFilterOpen(false)}><X size={24} /></IconButton>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
          <TextField
            label="Mes"
            select
            value={draftFilters.month}
            onChange={(e) => setDraftFilters((current) => ({ ...current, month: e.target.value }))}
            fullWidth
          >
            {monthOptions.map((month) => (
              <MenuItem key={month} value={month}>{month}</MenuItem>
            ))}
          </TextField>

          <TextField
            label="Programa académico"
            select
            value={draftFilters.program}
            onChange={(e) => setDraftFilters((current) => ({ ...current, program: e.target.value }))}
            fullWidth
          >
            <MenuItem value="default">Todos los programas</MenuItem>
            {programs.map((program: any[]) => (
              <MenuItem key={program[0]} value={String(program[0])}>{program[1]}</MenuItem>
            ))}
          </TextField>

          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button variant="outlined" fullWidth sx={{ height: 52, borderRadius: '12px', fontWeight: 700 }} onClick={clearFilters}>
              Limpiar
            </Button>
            <Button variant="contained" fullWidth sx={{ height: 52, borderRadius: '12px', fontWeight: 700, backgroundColor: '#4F8CFF' }} onClick={applyFilters}>
              Buscar
            </Button>
          </Box>
        </Box>
      </Drawer>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((current) => ({ ...current, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar((current) => ({ ...current, open: false }))} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </DashboardLayout>
  );
};

export default DashboardPage;
