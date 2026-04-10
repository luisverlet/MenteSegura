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
  Radio,
  RadioGroup,
  Stack,
  Divider
} from '@mui/material';
import { FileText, X, Download } from 'lucide-react';
import DashboardLayout from '@/core/components/layout/DashboardLayout';
import GenericTable from '@/core/components/Table/GenericTable';
import GenericInput from '@/core/components/Input/GenericInput';
import { usePagination } from '@/core/hooks/usePagination';
import { ExportOptions } from '@/core/types';

// ─── Mock Data ────────────────────────────────────────────
const MOCK_REPORTS = Array.from({ length: 30 }, (_, i) => ({
  id: i + 1,
  name: `Luis Alejandro Vergel ${i + 1}`,
  code: `0222013${1053 + i}`,
  risk: `${20 + (i % 5) * 10}%`,
  date: `${(i % 28) + 1} - 03 - 2026`,
}));

// ─── Default export options ───────────────────────────────
const defaultExportOptions: ExportOptions = {
  anonymousData: true,
  includePHQ9: true,
  includeGAD7: true,
  includeProbability: true,
  startDate: '',
  endDate: '',
};

// ─── Column definitions ───────────────────────────────────
const columns = [
  { id: 'name' as const, label: 'Nombre', align: 'left' as const, minWidth: 220 },
  { id: 'code' as const, label: 'Codigo UDES', align: 'center' as const, minWidth: 150 },
  { id: 'risk' as const, label: 'Ultimo nivel de riesgo', align: 'center' as const, minWidth: 180 },
  { id: 'date' as const, label: 'Fecha de última actividad', align: 'center' as const, minWidth: 200 },
];

// ─── Export Checkbox Row ──────────────────────────────────
const ExportCheckRow = ({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
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
        label={<Typography sx={{ fontWeight: 600, fontSize: '14px' }}>Sí</Typography>}
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

// ═══════════════════════════════════════════════════════════
// REPORTS PAGE
// ═══════════════════════════════════════════════════════════
const ReportsPage = () => {
  const { pagination, handlePageChange, handleRowsPerPageChange } = usePagination(10);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>(defaultExportOptions);
  const [isExporting, setIsExporting] = useState(false);

  const paginatedRows = MOCK_REPORTS.slice(
    pagination.page * pagination.rowsPerPage,
    pagination.page * pagination.rowsPerPage + pagination.rowsPerPage
  );

  const setOption = <K extends keyof ExportOptions>(key: K, value: ExportOptions[K]) => {
    setExportOptions((prev) => ({ ...prev, [key]: value }));
  };

  // Simulates export – swap with reportsService.exportReport(exportOptions) when backend is ready
  const handleExport = async () => {
    setIsExporting(true);
    await new Promise((r) => setTimeout(r, 1000)); // simulate network delay
    // TODO: const { downloadUrl } = await reportsService.exportReport(exportOptions);
    // window.open(downloadUrl, '_blank');
    console.info('[ReportsPage] Export triggered with options:', exportOptions);
    setIsExporting(false);
    setExportOpen(false);
  };

  return (
    <DashboardLayout
      title="Análisis y Reportes"
      subtitle="Generador de Reportes"
      Icon={FileText}
      onRightActionClick={() => setExportOpen(true)}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 3 }}>
        {/* Desktop export button */}
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

        {/* Table */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: paginatedRows.length < 5 ? 'center' : 'flex-start', pb: 4 }}>
          <Card sx={{ backgroundColor: '#FFF !important', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <GenericTable
              columns={columns}
              rows={paginatedRows}
              totalRows={MOCK_REPORTS.length}
              page={pagination.page}
              rowsPerPage={pagination.rowsPerPage}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
            />
          </Card>
        </Box>
      </Box>

      {/* Export Drawer */}
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
            Opciones de exportación
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
            onChange={(v) => setOption('anonymousData', v)}
          />
          <ExportCheckRow
            label="PHQ9"
            checked={exportOptions.includePHQ9}
            onChange={(v) => setOption('includePHQ9', v)}
          />
          <ExportCheckRow
            label="GAD7"
            checked={exportOptions.includeGAD7}
            onChange={(v) => setOption('includeGAD7', v)}
          />
          <ExportCheckRow
            label="Probabilidad"
            checked={exportOptions.includeProbability}
            onChange={(v) => setOption('includeProbability', v)}
          />

          <Box>
            <GenericInput
              labelTitle="Fecha inicio"
              placeholder="DD/MM/AAAA"
              value={exportOptions.startDate}
              onChange={(e) => setOption('startDate', e.target.value)}
            />
          </Box>
          <Box>
            <GenericInput
              labelTitle="Fecha fin"
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
    </DashboardLayout>
  );
};

export default ReportsPage;
