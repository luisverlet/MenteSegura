'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Button,
  Drawer,
  IconButton,
  Checkbox,
  FormControlLabel,
  Stack,
  Divider,
  Snackbar,
  Alert,
} from '@mui/material';
import { FileText, X, Download } from 'lucide-react';
import DashboardLayout from '@/core/components/layout/DashboardLayout';
import GenericTable from '@/core/components/Table/GenericTable';
import GenericInput from '@/core/components/Input/GenericInput';
import { usePagination } from '@/core/hooks/usePagination';
import { ExportOptions } from '@/core/types';
import { formatRisk, toTitleCase } from '@/core/utils/formatters';

const defaultExportOptions: ExportOptions = {
  anonymousData: true,
  includePHQ9: true,
  includeGAD7: true,
  includeProbability: true,
  startDate: '',
  endDate: '',
};

const columns = [
  { id: 'name' as const, label: 'Nombre', align: 'left' as const, minWidth: 220 },
  { id: 'code' as const, label: 'Codigo UDES', align: 'center' as const, minWidth: 150 },
  { id: 'risk' as const, label: 'Ultimo nivel de riesgo', align: 'center' as const, minWidth: 180 },
  { id: 'date' as const, label: 'Fecha de ultima actividad', align: 'center' as const, minWidth: 200 },
];

const ExportCheckRow = ({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) => (
  <Box>
    <Typography sx={{ fontWeight: 800, fontSize: '15px', mb: 1, color: '#1E293B' }}>{label}</Typography>
    <Box sx={{ display: 'flex', gap: 3 }}>
      <FormControlLabel
        control={
          <Checkbox
            checked={checked}
            onChange={() => onChange(true)}
            sx={{ color: '#4F8CFF', '&.Mui-checked': { color: '#4F8CFF' } }}
          />
        }
        label={<Typography sx={{ fontWeight: 600, fontSize: '14px' }}>Si</Typography>}
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={!checked}
            onChange={() => onChange(false)}
            sx={{ color: '#94A3B8', '&.Mui-checked': { color: '#4F8CFF' } }}
          />
        }
        label={<Typography sx={{ fontWeight: 600, fontSize: '14px' }}>No</Typography>}
      />
    </Box>
  </Box>
);

const ReportsPage = () => {
  const { pagination, handlePageChange, handleRowsPerPageChange } = usePagination(10);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>(defaultExportOptions);
  const [isExporting, setIsExporting] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'error' | 'success' }>({
    open: false,
    message: '',
    severity: 'error',
  });

  React.useEffect(() => {
    const fetchStudents = async () => {
      const token = localStorage.getItem('auth_token');
      try {
        const response = await fetch('/api/proxy/evaluations?page=1&limit=100', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) return;

        const data = await response.json();
        const items = data.items || data.data || [];

        const mappedStudents = items.map((item: any) => ({
          id: item.student_id,
          name: toTitleCase(`${item.name || ''} ${item.last_name || ''}`.trim() || 'Sin nombre'),
          code: item.student_code || 'N/A',
          risk: formatRisk(item.current_risk),
          date: item.last_evaluation_date ? new Date(item.last_evaluation_date).toLocaleDateString() : 'Sin actividad',
        }));

        setStudents(mappedStudents);
      } catch (error) {
        console.error('Error al obtener estudiantes', error);
      }
    };

    fetchStudents();
  }, []);

  const paginatedRows = students.slice(
    pagination.page * pagination.rowsPerPage,
    pagination.page * pagination.rowsPerPage + pagination.rowsPerPage
  );

  const setOption = <K extends keyof ExportOptions>(key: K, value: ExportOptions[K]) => {
    setExportOptions((prev) => ({ ...prev, [key]: value }));
  };

  const handleExport = async () => {
    setIsExporting(true);
    const token = localStorage.getItem('auth_token');

    try {
      const params = new URLSearchParams({
        page: '1',
        limit: '100',
      });

      const response = await fetch(`/api/proxy/reports/export?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        setSnackbar({ open: true, message: 'No pudimos exportar el reporte.', severity: 'error' });
        return;
      }

      const contentDisposition = response.headers.get('content-disposition') || '';
      const contentType = response.headers.get('content-type') || '';
      const filenameMatch = contentDisposition.match(/filename\*?=(?:UTF-8'')?["']?([^;"']+)/i);
      const fallbackExtension = contentType.includes('pdf')
        ? 'pdf'
        : contentType.includes('sheet') || contentType.includes('excel')
          ? 'xlsx'
          : contentType.includes('csv')
            ? 'csv'
            : 'bin';
      const filename = filenameMatch?.[1]
        ? decodeURIComponent(filenameMatch[1].replace(/['"]/g, ''))
        : `reporte_mentesegura_${new Date().toISOString().split('T')[0]}.${fallbackExtension}`;

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setSnackbar({ open: true, message: 'Reporte exportado correctamente.', severity: 'success' });
      setExportOpen(false);
    } catch (error) {
      console.error('Error en exportacion', error);
      setSnackbar({ open: true, message: 'Error de conexion al exportar.', severity: 'error' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar((current) => ({ ...current, open: false }));
  };

  return (
    <DashboardLayout
      title="Analisis y Reportes"
      subtitle="Generador de Reportes"
      Icon={FileText}
      onRightActionClick={() => setExportOpen(true)}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 3 }}>
        <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            onClick={() => setExportOpen(true)}
            startIcon={<Download size={18} />}
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
            Exportar
          </Button>
        </Box>

        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: paginatedRows.length < 5 ? 'center' : 'flex-start', pb: 4 }}>
          <Card sx={{ backgroundColor: '#FFF !important', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <GenericTable
              columns={columns}
              rows={paginatedRows}
              totalRows={students.length}
              page={pagination.page}
              rowsPerPage={pagination.rowsPerPage}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
            />
          </Card>
        </Box>
      </Box>

      <Drawer
        anchor="right"
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 420 },
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#1E293B' }}>
            Opciones de exportacion
          </Typography>
          <IconButton onClick={() => setExportOpen(false)}>
            <X size={22} />
          </IconButton>
        </Box>

        <Divider sx={{ mb: 1 }} />

        <Stack spacing={3}>
          <ExportCheckRow
            label="Datos anonimos"
            checked={exportOptions.anonymousData}
            onChange={(value) => setOption('anonymousData', value)}
          />
          <ExportCheckRow
            label="PHQ9"
            checked={exportOptions.includePHQ9}
            onChange={(value) => setOption('includePHQ9', value)}
          />
          <ExportCheckRow
            label="GAD7"
            checked={exportOptions.includeGAD7}
            onChange={(value) => setOption('includeGAD7', value)}
          />
          <ExportCheckRow
            label="Probabilidad"
            checked={exportOptions.includeProbability}
            onChange={(value) => setOption('includeProbability', value)}
          />

          <Box>
            <GenericInput
              labelTitle="Fecha de inicio"
              placeholder="DD/MM/AAAA"
              value={exportOptions.startDate}
              onChange={(e) => setOption('startDate', e.target.value)}
            />
          </Box>
          <Box>
            <GenericInput
              labelTitle="Fecha de fin"
              placeholder="DD/MM/AAAA"
              value={exportOptions.endDate}
              onChange={(e) => setOption('endDate', e.target.value)}
            />
          </Box>
        </Stack>

        <Box sx={{ mt: 'auto', pt: 4 }}>
          <Button
            variant="contained"
            fullWidth
            onClick={handleExport}
            disabled={isExporting}
            sx={{
              height: 52,
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '16px',
              backgroundColor: '#4F8CFF',
              '&:hover': { backgroundColor: '#3b82f6' },
            }}
          >
            {isExporting ? 'Exportando...' : 'Exportar'}
          </Button>
        </Box>
      </Drawer>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </DashboardLayout>
  );
};

export default ReportsPage;
