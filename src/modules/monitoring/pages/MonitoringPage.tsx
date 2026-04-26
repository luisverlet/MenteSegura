'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Link,
  Drawer,
  Button,
  IconButton,
  Grid,
  InputAdornment,
} from '@mui/material';
import { Monitor, X, Search, ListFilter } from 'lucide-react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/core/components/layout/DashboardLayout';
import GenericTable from '@/core/components/table/GenericTable';
import GenericInput from '@/core/components/Input/GenericInput';
import { usePagination } from '@/core/hooks/usePagination';
import { FilterState, Student } from '@/core/types';
import * as styles from './monitoring.styles';

const defaultFilters: FilterState = {
  name: '',
  code: '',
  riskMin: '',
  riskMax: '',
  startDate: '',
  endDate: '',
};

// ─── Column definitions ───────────────────────────────────
const buildColumns = (onViewDetail: (id: number) => void) => [
  { id: 'name' as const, label: 'Nombre', align: 'left' as const, minWidth: 250 },
  { id: 'code' as const, label: 'Codigo UDES', align: 'center' as const, minWidth: 150 },
  { id: 'risk' as const, label: 'Ultimo nivel de riesgo', align: 'center' as const, minWidth: 180 },
  { id: 'date' as const, label: 'Fecha de última actividad', align: 'center' as const, minWidth: 200 },
  {
    id: 'actions' as const,
    label: 'Accion',
    align: 'center' as const,
    format: (_: unknown, row: Student) => (
      <Box
        component="span"
        onClick={() => onViewDetail(row.id)}
        sx={{ ...styles.detailLinkStyles, cursor: 'pointer' }}
      >
        Ver Detalle
      </Box>
    ),
  },
];

// ═══════════════════════════════════════════════════════════
// MONITORING PAGE
// ═══════════════════════════════════════════════════════════
import { formatRisk, toTitleCase } from '@/core/utils/formatters';

const MonitoringPage = () => {
  const router = useRouter();
  const { pagination, handlePageChange, handleRowsPerPageChange, resetPage } = usePagination(10);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState<FilterState>(defaultFilters);
  const [activeFilters, setActiveFilters] = useState<FilterState>(defaultFilters);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    const fetchStudents = async () => {
      const token = localStorage.getItem('auth_token');
      try {
        const res = await fetch('/api/proxy/evaluations', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          const items = data.items || [];
          
          const mappedStudents = items.map((item: any) => ({
            id: item.student_id,
            name: toTitleCase(`${item.name || ''} ${item.last_name || ''}`.trim() || 'Sin Nombre'),
            code: item.student_code || 'N/A',
            risk: formatRisk(item.current_risk),
            date: item.last_evaluation_date ? new Date(item.last_evaluation_date).toLocaleDateString() : 'Sin actividad'
          }));
          setStudents(mappedStudents);
        }
      } catch (error) {
        console.error('Failed to fetch students', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const hasActiveFilters = Object.values(activeFilters).some((v) => v !== '');
  const columns = buildColumns((id) => router.push(`/monitoring/${id}`));

  // Client-side filter – swap for server-side when API is ready
  const filteredData = students.filter((s) => {
    if (activeFilters.name && !s.name.toLowerCase().includes(activeFilters.name.toLowerCase())) return false;
    if (activeFilters.code && !s.code.includes(activeFilters.code)) return false;
    return true;
  });

  const paginatedRows = filteredData.slice(
    pagination.page * pagination.rowsPerPage,
    pagination.page * pagination.rowsPerPage + pagination.rowsPerPage
  );

  const applyFilters = () => {
    setActiveFilters(draftFilters);
    resetPage();
    setIsFilterOpen(false);
  };

  const clearFilters = () => {
    setDraftFilters(defaultFilters);
    setActiveFilters(defaultFilters);
    resetPage();
  };

  return (
    <DashboardLayout
      title="Monitoreo Estudiantil"
      subtitle="Busqueda y listado"
      Icon={Monitor}
      onRightActionClick={() => setIsFilterOpen(true)}
    >
      <Box sx={styles.pageWrapperStyles}>
        {/* Desktop filter button */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'flex-end', mb: 3 }}>
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
            Filtros {hasActiveFilters && `(activos)`}
          </Button>
        </Box>

        {/* Data table */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            justifyContent: filteredData.length < 5 ? 'center' : 'flex-start',
            pb: 4,
          }}
        >
          <Card sx={{ ...styles.tableCardStyles, backgroundColor: '#FFF !important' }}>
            <GenericTable
              columns={columns}
              rows={paginatedRows}
              totalRows={filteredData.length}
              page={pagination.page}
              rowsPerPage={pagination.rowsPerPage}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
            />
          </Card>
        </Box>

        {/* Filter Drawer */}
        <Drawer
          anchor="right"
          open={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
          PaperProps={{ sx: styles.drawerPaperStyles }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>Filtros Avanzados</Typography>
            <IconButton onClick={() => setIsFilterOpen(false)}><X size={24} /></IconButton>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            <GenericInput
              labelTitle="Nombre"
              placeholder="Buscar Nombre"
              value={draftFilters.name}
              onChange={(e) => setDraftFilters((p) => ({ ...p, name: e.target.value }))}
              InputProps={{
                endAdornment: <InputAdornment position="end"><Search size={18} /></InputAdornment>,
              }}
            />
            <GenericInput
              labelTitle="Codigo"
              placeholder="Buscar codigo"
              value={draftFilters.code}
              onChange={(e) => setDraftFilters((p) => ({ ...p, code: e.target.value }))}
            />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#64748B', fontSize: '13px' }}>
                Rango de riesgo (Opcional)
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <GenericInput placeholder="0%" value={draftFilters.riskMin} onChange={(e) => setDraftFilters((p) => ({ ...p, riskMin: e.target.value }))} />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <GenericInput placeholder="100%" value={draftFilters.riskMax} onChange={(e) => setDraftFilters((p) => ({ ...p, riskMax: e.target.value }))} />
                </Grid>
              </Grid>
            </Box>
            <GenericInput labelTitle="Fecha inicio" placeholder="DD/MM/AAAA" value={draftFilters.startDate} onChange={(e) => setDraftFilters((p) => ({ ...p, startDate: e.target.value }))} />
            <GenericInput labelTitle="Fecha fin" placeholder="DD/MM/AAAA" value={draftFilters.endDate} onChange={(e) => setDraftFilters((p) => ({ ...p, endDate: e.target.value }))} />

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
      </Box>
    </DashboardLayout>
  );
};

export default MonitoringPage;
