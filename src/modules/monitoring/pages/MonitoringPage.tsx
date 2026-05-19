'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Drawer,
  Button,
  IconButton,
  Grid,
  InputAdornment,
  Snackbar,
  Alert,
} from '@mui/material';
import { Monitor, X, Search, ListFilter } from 'lucide-react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/core/components/layout/DashboardLayout';
import GenericTable from '@/core/components/Table/GenericTable';
import GenericInput from '@/core/components/Input/GenericInput';
import { usePagination } from '@/core/hooks/usePagination';
import { FilterState, Student } from '@/core/types';
import * as styles from './monitoring.styles';
import { combineRisks, formatRisk, toTitleCase } from '@/core/utils/formatters';
import { fetchWithRetry } from '@/core/utils/network';
import { buildNetworkError, buildRequestError } from '@/core/utils/request-feedback';

const defaultFilters: FilterState = {
  name: '',
  code: '',
  riskMin: '',
  riskMax: '',
  startDate: '',
  endDate: '',
};

const buildColumns = (onViewDetail: (id: number) => void) => [
  { id: 'name' as const, label: 'Nombre', align: 'left' as const, minWidth: 250 },
  { id: 'code' as const, label: 'Codigo UDES', align: 'center' as const, minWidth: 150 },
  { id: 'risk' as const, label: 'Ultimo nivel de riesgo', align: 'center' as const, minWidth: 180 },
  { id: 'date' as const, label: 'Fecha de ultima actividad', align: 'center' as const, minWidth: 200 },
  {
    id: 'actions' as const,
    label: 'Accion',
    align: 'center' as const,
    format: (_: unknown, row: Student) => (
      <Box component="span" onClick={() => onViewDetail(row.id)} sx={{ ...styles.detailLinkStyles, cursor: 'pointer' }}>
        Ver Detalle
      </Box>
    ),
  },
];

const MonitoringPage = () => {
  const router = useRouter();
  const { pagination, handlePageChange, handleRowsPerPageChange, resetPage } = usePagination(10);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState<FilterState>(defaultFilters);
  const [activeFilters, setActiveFilters] = useState<FilterState>(defaultFilters);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'error' | 'warning' }>({
    open: false,
    message: '',
    severity: 'error',
  });

  React.useEffect(() => {
    const fetchStudents = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setPageError('No encontramos una sesion activa para consultar el monitoreo.');
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetchWithRetry('/api/proxy/evaluations', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          const items = data.items || [];

          const detailEntries = await Promise.all(
            items.map(async (item: any) => {
              try {
                const detailRes = await fetchWithRetry(`/api/proxy/students/${item.student_id}/evaluations`, {
                  headers: { Authorization: `Bearer ${token}` }
                });

                if (!detailRes.ok) {
                  return null;
                }

                return await detailRes.json();
              } catch {
                return null;
              }
            })
          );

          const mappedStudents = items.map((item: any, index: number) => {
            const detail = detailEntries[index];
            const phqRisk =
              detail?.latest_phq9?.risk ||
              detail?.latest_phq9?.classification ||
              detail?.phq_risk;
            const gadRisk =
              detail?.latest_gad7?.risk ||
              detail?.latest_gad7?.classification ||
              detail?.gad_risk ||
              detail?.anxiety_risk;

            return {
              id: item.student_id,
              name: toTitleCase(`${item.name || ''} ${item.last_name || ''}`.trim() || 'Sin nombre'),
              code: item.student_code || 'N/A',
              risk: combineRisks(phqRisk, gadRisk, item.current_risk),
              date: item.last_evaluation_date ? new Date(item.last_evaluation_date).toLocaleDateString() : 'Sin actividad'
            };
          });
          setStudents(mappedStudents);
        } else {
          setPageError(await buildRequestError(res, 'No pudimos cargar los estudiantes para monitoreo.'));
        }
      } catch (error) {
        console.error('Error al obtener estudiantes', error);
        setPageError(buildNetworkError('los estudiantes de monitoreo'));
      } finally {
        setIsLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const hasActiveFilters = Object.values(activeFilters).some((v) => v !== '');
  const columns = buildColumns((id) => router.push(`/monitoring/${id}`));

  const filteredData = students.filter((student) => {
    if (activeFilters.name && !student.name.toLowerCase().includes(activeFilters.name.toLowerCase())) return false;
    if (activeFilters.code && !student.code.includes(activeFilters.code)) return false;
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
        {pageError && (
          <Card sx={{ p: 3, borderRadius: '20px', border: '1px solid #FECACA', backgroundColor: '#FFF5F5', boxShadow: 'none', mb: 3 }}>
            <Typography sx={{ fontWeight: 800, color: '#B91C1C', mb: 0.7 }}>
              No pudimos cargar completamente el monitoreo
            </Typography>
            <Typography sx={{ color: '#7F1D1D', fontWeight: 600, fontSize: '14px' }}>
              {pageError}
            </Typography>
          </Card>
        )}

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

        <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: filteredData.length < 5 ? 'center' : 'flex-start', pb: 4 }}>
          <Card sx={{ ...styles.tableCardStyles, backgroundColor: '#FFF !important' }}>
            <GenericTable
              columns={columns}
              rows={paginatedRows}
              totalRows={filteredData.length}
              page={pagination.page}
              rowsPerPage={pagination.rowsPerPage}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
              isLoading={isLoading}
            />
          </Card>
        </Box>

        <Drawer anchor="right" open={isFilterOpen} onClose={() => setIsFilterOpen(false)} PaperProps={{ sx: styles.drawerPaperStyles }}>
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
              InputProps={{ endAdornment: <InputAdornment position="end"><Search size={18} /></InputAdornment> }}
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
            <GenericInput labelTitle="Fecha de inicio" placeholder="DD/MM/AAAA" value={draftFilters.startDate} onChange={(e) => setDraftFilters((p) => ({ ...p, startDate: e.target.value }))} />
            <GenericInput labelTitle="Fecha de fin" placeholder="DD/MM/AAAA" value={draftFilters.endDate} onChange={(e) => setDraftFilters((p) => ({ ...p, endDate: e.target.value }))} />

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

export default MonitoringPage;
