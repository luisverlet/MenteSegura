'use client';

import React, { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Button,
  Drawer,
  IconButton,
  Snackbar,
  Divider,
  InputAdornment,
  TextField,
  MenuItem,
} from '@mui/material';
import { CalendarDays, X, Search, ListFilter } from 'lucide-react';
import DashboardLayout from '@/core/components/layout/DashboardLayout';
import GenericTable from '@/core/components/Table/GenericTable';
import GenericInput from '@/core/components/Input/GenericInput';
import FormDatePicker from '@/core/components/FormDatePicker';
import { usePagination } from '@/core/hooks/usePagination';
import { Appointment, FilterState } from '@/core/types';
import * as styles from './appointments.styles';
import { fetchWithRetry } from '@/core/utils/network';
import { buildNetworkError, buildRequestError } from '@/core/utils/request-feedback';
import { combineRisks, formatRisk, toTitleCase } from '@/core/utils/formatters';
import dayjs from 'dayjs';
import {
  isAppointmentSlotTaken,
  normalizeDateKeyFromIso,
  normalizeTimeKeyFromIso,
  parseDateInput,
  parseTimeInput,
  validateAppointmentSchedule,
} from '@/core/utils/date-time-validation';

const defaultFilters: FilterState = {
  name: '',
  code: '',
  riskMin: '',
  riskMax: '',
  startDate: '',
  endDate: '',
};

const normalizeArrayPayload = (payload: any) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const normalizeLookupName = (value: string | null | undefined) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const extractStudentId = (appointment: any) => {
  if (Array.isArray(appointment)) {
    const arrayCandidate = Number(appointment[1] ?? appointment[2]);
    if (!Number.isNaN(arrayCandidate) && arrayCandidate > 0) return arrayCandidate;
  }

  const candidates = [
    appointment?.student_id,
    appointment?.id_estudiante,
    appointment?.student?.id,
    appointment?.student?.student_id,
  ];

  for (const candidate of candidates) {
    const parsed = Number(candidate);
    if (!Number.isNaN(parsed) && parsed > 0) return parsed;
  }

  return null;
};

const extractAppointmentDate = (appointment: any) =>
  (Array.isArray(appointment) ? appointment[2] || appointment[3] : null) ||
  appointment?.appointment_date ||
  appointment?.date ||
  appointment?.fecha ||
  appointment?.scheduled_at ||
  '';

const extractPhqRisk = (item: any) =>
  item?.latest_phq9?.risk ||
  item?.latest_phq9?.classification ||
  item?.phq_risk ||
  item?.depression_risk;

const extractGadRisk = (item: any) =>
  item?.latest_gad7?.risk ||
  item?.latest_gad7?.classification ||
  item?.gad_risk ||
  item?.anxiety_risk;

const getEvaluationRisk = (item: any) =>
  combineRisks(extractPhqRisk(item), extractGadRisk(item), item?.current_risk || item?.risk);

const formatDate = (isoDate: string) => {
  if (!isoDate) return 'Sin fecha';
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString();
};

const formatTime = (isoDate: string) => {
  if (!isoDate) return 'Sin hora';
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDatetimeLocal = (isoDate: string | undefined) => {
  if (!isoDate) return '';
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return '';

  const timezoneOffset = parsed.getTimezoneOffset() * 60000;
  return new Date(parsed.getTime() - timezoneOffset).toISOString().slice(0, 16);
};

const statusOptions = ['Pendiente', 'Programada', 'Confirmada', 'Completada', 'Cancelada'];
const appointmentHourOptions = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

const columns = (onManage: (appointment: Appointment) => void) => [
  { id: 'date' as const, label: 'Fecha', align: 'center' as const, minWidth: 120 },
  { id: 'time' as const, label: 'Hora', align: 'center' as const, minWidth: 120 },
  { id: 'studentName' as const, label: 'Estudiante', align: 'left' as const, minWidth: 220 },
  {
    id: 'riskSummary' as const,
    label: 'Ultimo nivel de riesgo',
    align: 'left' as const,
    minWidth: 220,
  },
  {
    id: 'actions' as const,
    label: 'Accion',
    align: 'center' as const,
    minWidth: 140,
    format: (_: unknown, row: Appointment) => (
      <Box component="span" onClick={() => onManage(row)} sx={{ ...styles.detailLinkStyles, cursor: 'pointer' }}>
        Gestionar cita
      </Box>
    ),
  },
];

const AppointmentsPage = () => {
  const { pagination, handlePageChange, handleRowsPerPageChange, resetPage } = usePagination(10);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState<FilterState>(defaultFilters);
  const [activeFilters, setActiveFilters] = useState<FilterState>(defaultFilters);
  const [filterErrors, setFilterErrors] = useState<Partial<Pick<FilterState, 'startDate' | 'endDate'>>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingAppointment, setIsSavingAppointment] = useState(false);
  const [isDeletingAppointment, setIsDeletingAppointment] = useState(false);
  const [appointmentForm, setAppointmentForm] = useState({
    appointmentDate: '',
    status: 'Pendiente',
    reason: '',
  });
  const [pageError, setPageError] = useState('');
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const fetchAppointments = React.useCallback(async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setPageError('No encontramos una sesion activa para consultar las citas.');
      setIsLoading(false);
      return;
    }

    try {
      const [appointmentsRes, studentsRes, usersRes, evaluationsRes] = await Promise.all([
        fetchWithRetry('/api/proxy/appointments', { headers: { Authorization: `Bearer ${token}` } }),
        fetchWithRetry('/api/proxy/students?page=1&limit=100', { headers: { Authorization: `Bearer ${token}` } }),
        fetchWithRetry('/api/proxy/users', { headers: { Authorization: `Bearer ${token}` } }),
        fetchWithRetry('/api/proxy/evaluations?page=1&limit=100', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const errors: string[] = [];
      if (!appointmentsRes.ok) errors.push(await buildRequestError(appointmentsRes, 'No pudimos cargar la agenda de citas.'));
      if (!studentsRes.ok) errors.push(await buildRequestError(studentsRes, 'No pudimos cargar los estudiantes asociados a las citas.'));
      if (!usersRes.ok) errors.push(await buildRequestError(usersRes, 'No pudimos cargar los nombres de los estudiantes.'));
      if (!evaluationsRes.ok) errors.push(await buildRequestError(evaluationsRes, 'No pudimos cargar el historial de evaluaciones.'));

      if (errors.length > 0) {
        setPageError(errors[0]);
        if (errors.length > 1) {
          setSnackbar({ open: true, message: errors.slice(1).join(' '), severity: 'warning' });
        }
        setAppointments([]);
        return;
      }

      setPageError('');

      const rawAppointments = normalizeArrayPayload(await appointmentsRes.json());
      const rawStudents = normalizeArrayPayload(await studentsRes.json());
      const rawUsers = normalizeArrayPayload(await usersRes.json());
      const evaluationsPayload = await evaluationsRes.json();
      const evaluationItems = evaluationsPayload.items || evaluationsPayload.data || [];

      const studentToUserMap = new Map<number, number>();
      rawStudents.forEach((student: any) => {
        if (Array.isArray(student) && student.length >= 2) {
          studentToUserMap.set(Number(student[0]), Number(student[1]));
        } else if (student?.id && student?.user_id) {
          studentToUserMap.set(Number(student.id), Number(student.user_id));
        }
      });

      const userNameMap = new Map<number, string>();
      rawUsers.forEach((user: any) => {
        if (Array.isArray(user) && user.length >= 3) {
          userNameMap.set(user[0], toTitleCase(`${user[1] || ''} ${user[2] || ''}`.trim()));
        } else if (user?.id) {
          const fullName = user?.name && user?.last_name
            ? `${user.name} ${user.last_name}`
            : user?.name || user?.full_name || '';
          userNameMap.set(Number(user.id), toTitleCase(fullName));
        }
      });

      const riskMap = new Map<number, string>(
        evaluationItems.map((item: any) => [
          Number(item.student_id),
          getEvaluationRisk(item),
        ] as const)
      );

      const riskByStudentName = new Map<string, string>(
        evaluationItems.map((item: any) => {
          const normalizedName = toTitleCase(`${item.name || ''} ${item.last_name || ''}`.trim() || 'Sin nombre');

          return [
            normalizeLookupName(normalizedName),
            getEvaluationRisk(item),
          ] as const;
        })
      );

      const normalizedAppointments: Appointment[] = rawAppointments.map((appointment: any, index: number) => {
        const appointmentDate = extractAppointmentDate(appointment);
        const studentId = extractStudentId(appointment);
        const userId = studentId ? studentToUserMap.get(studentId) : undefined;
        const derivedName = userId ? userNameMap.get(userId) : '';
        const resolvedStudentName = toTitleCase(
          appointment?.student_name ||
          appointment?.student?.name ||
          appointment?.full_name ||
          derivedName ||
          'Estudiante no identificado'
        );
        const resolvedRisk =
          appointment?.risk ||
          appointment?.current_risk ||
          (studentId ? riskMap.get(studentId) : '') ||
          riskByStudentName.get(normalizeLookupName(resolvedStudentName)) ||
          'Sin datos';

        return {
          id: Number(appointment?.id || appointment?.appointment_id || appointment?.id_cita || index + 1),
          date: formatDate(appointmentDate),
          time: formatTime(appointmentDate),
          studentName: resolvedStudentName,
          riskSummary: formatRisk(resolvedRisk),
          place: appointment?.place || appointment?.location || appointment?.lugar || 'Por asignar',
          reason: appointment?.reason || appointment?.motivo || 'Sin motivo registrado',
          status: appointment?.status || appointment?.estado || 'Pendiente',
          studentId,
          appointmentDateIso: appointmentDate,
        };
      });

      setAppointments(normalizedAppointments);
    } catch (error) {
      console.error('Error al obtener citas', error);
      setPageError(buildNetworkError('la agenda de citas'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const filteredAppointments = useMemo(
    () => {
      const dateFilter = parseDateInput(activeFilters.startDate);
      const timeFilter = parseTimeInput(activeFilters.endDate);

      return appointments.filter((appointment) => {
        if (
          activeFilters.name &&
          !appointment.studentName.toLowerCase().includes(activeFilters.name.toLowerCase())
        ) return false;

        if (
          activeFilters.code &&
          !appointment.riskSummary.toLowerCase().includes(activeFilters.code.toLowerCase())
        ) return false;

        if (dateFilter.dateKey && normalizeDateKeyFromIso(appointment.appointmentDateIso) !== dateFilter.dateKey) return false;
        if (timeFilter.timeKey && normalizeTimeKeyFromIso(appointment.appointmentDateIso) !== timeFilter.timeKey) return false;

        return true;
      });
    },
    [appointments, activeFilters]
  );

  React.useEffect(() => {
    const maxPage = Math.max(Math.ceil(Math.max(filteredAppointments.length, 1) / pagination.rowsPerPage) - 1, 0);
    if (pagination.page > maxPage) {
      resetPage();
    }
  }, [filteredAppointments.length, pagination.page, pagination.rowsPerPage, resetPage]);

  const paginatedRows = useMemo(
    () =>
      filteredAppointments.slice(
        pagination.page * pagination.rowsPerPage,
        pagination.page * pagination.rowsPerPage + pagination.rowsPerPage
      ),
    [filteredAppointments, pagination.page, pagination.rowsPerPage]
  );

  const hasActiveFilters = Object.values(activeFilters).some((value) => value !== '');
  const selectedDateKey = normalizeDateKeyFromIso(appointmentForm.appointmentDate);
  const scheduleValidation = selectedAppointment
    ? validateAppointmentSchedule(appointmentForm.appointmentDate, appointments, selectedAppointment.id)
    : { isValid: true };

  const handleManage = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setAppointmentForm({
      appointmentDate: formatDatetimeLocal(appointment.appointmentDateIso),
      status: appointment.status || 'Pendiente',
      reason: appointment.reason || '',
    });
    setDrawerOpen(true);
  };

  const handleUpdateAppointment = async () => {
    if (!selectedAppointment) return;

    const token = localStorage.getItem('auth_token');
    if (!token) {
      setSnackbar({ open: true, message: 'No encontramos una sesion activa para actualizar la cita.', severity: 'error' });
      return;
    }

    setIsSavingAppointment(true);

    try {
      const validation = validateAppointmentSchedule(appointmentForm.appointmentDate, appointments, selectedAppointment.id);
      if (!validation.isValid) {
        setSnackbar({ open: true, message: validation.message || 'Revisa la fecha y hora de la cita.', severity: 'warning' });
        return;
      }

      const response = await fetchWithRetry(`/api/proxy/appointments/${selectedAppointment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          appointment_date: new Date(appointmentForm.appointmentDate).toISOString(),
          status: appointmentForm.status,
          reason: appointmentForm.reason.trim(),
        }),
      });

      if (response.ok) {
        setSnackbar({ open: true, message: 'Cita actualizada correctamente.', severity: 'success' });
        setDrawerOpen(false);
        await fetchAppointments();
      } else {
        setSnackbar({ open: true, message: await buildRequestError(response, 'No pudimos actualizar la cita.'), severity: 'error' });
      }
    } catch {
      setSnackbar({ open: true, message: buildNetworkError('la actualizacion de la cita'), severity: 'error' });
    } finally {
      setIsSavingAppointment(false);
    }
  };

  const handleDeleteAppointment = async () => {
    if (!selectedAppointment) return;

    const token = localStorage.getItem('auth_token');
    if (!token) {
      setSnackbar({ open: true, message: 'No encontramos una sesion activa para eliminar la cita.', severity: 'error' });
      return;
    }

    setIsDeletingAppointment(true);

    try {
      const response = await fetchWithRetry(`/api/proxy/appointments/${selectedAppointment.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setSnackbar({ open: true, message: 'Cita eliminada correctamente.', severity: 'success' });
        setDrawerOpen(false);
        await fetchAppointments();
      } else {
        setSnackbar({ open: true, message: await buildRequestError(response, 'No pudimos eliminar la cita.'), severity: 'error' });
      }
    } catch {
      setSnackbar({ open: true, message: buildNetworkError('la eliminacion de la cita'), severity: 'error' });
    } finally {
      setIsDeletingAppointment(false);
    }
  };

  const applyFilters = () => {
    const dateValidation = parseDateInput(draftFilters.startDate);
    if (dateValidation.error) {
      setFilterErrors({ startDate: dateValidation.error });
      setSnackbar({ open: true, message: dateValidation.error, severity: 'warning' });
      return;
    }

    const timeValidation = parseTimeInput(draftFilters.endDate);
    if (timeValidation.error) {
      setFilterErrors({ endDate: timeValidation.error });
      setSnackbar({ open: true, message: timeValidation.error, severity: 'warning' });
      return;
    }

    setFilterErrors({});
    setActiveFilters(draftFilters);
    resetPage();
    setIsFilterOpen(false);
  };

  const clearFilters = () => {
    setDraftFilters(defaultFilters);
    setActiveFilters(defaultFilters);
    setFilterErrors({});
    resetPage();
  };

  return (
    <DashboardLayout
      title="Modulo de Citas"
      subtitle="Agenda de solicitudes de bienestar"
      Icon={CalendarDays}
      onRightActionClick={() => setIsFilterOpen(true)}
    >
      <Box sx={styles.pageWrapperStyles}>
        {pageError && (
          <Card sx={{ p: 3, borderRadius: '20px', border: '1px solid #FECACA', backgroundColor: '#FFF5F5', boxShadow: 'none', mb: 3 }}>
            <Typography sx={{ fontWeight: 800, color: '#B91C1C', mb: 0.7 }}>
              No pudimos cargar completamente las citas
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

        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', pb: 4 }}>
          <Card sx={{ ...styles.tableCardStyles, backgroundColor: '#FFF !important' }}>
            <GenericTable
              columns={columns(handleManage)}
              rows={paginatedRows}
              totalRows={filteredAppointments.length}
              page={pagination.page}
              rowsPerPage={pagination.rowsPerPage}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
              isLoading={isLoading}
            />
          </Card>
        </Box>
      </Box>

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: styles.drawerPaperStyles }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#1E293B' }}>
            Gestionar cita
          </Typography>
          <IconButton onClick={() => setDrawerOpen(false)}>
            <X size={22} />
          </IconButton>
        </Box>

        <Divider />

        {selectedAppointment && (
          <>
            <Card elevation={0} sx={styles.detailCardStyles}>
              <Typography sx={styles.detailTitleStyles}>
                {selectedAppointment.studentName}
              </Typography>
              <Box>
                <Typography sx={styles.detailLabelStyles}>Nivel de riesgo:</Typography>
                <Typography sx={styles.detailValueStyles}>{selectedAppointment.riskSummary}</Typography>
              </Box>
              <Box>
                <Typography sx={styles.detailLabelStyles}>Fecha y hora:</Typography>
                <Typography sx={styles.detailValueStyles}>{selectedAppointment.date} a las {selectedAppointment.time}</Typography>
              </Box>
              <Box>
                <Typography sx={styles.detailLabelStyles}>Motivo de la cita:</Typography>
                <Typography sx={styles.detailValueStyles}>{selectedAppointment.reason}</Typography>
              </Box>
            </Card>

            <Box sx={styles.formFieldsWrapStyles}>
              <FormDatePicker
                label="Fecha"
                value={appointmentForm.appointmentDate ? dayjs(appointmentForm.appointmentDate) : null}
                minDate={dayjs().startOf('day')}
                error={scheduleValidation.dateError}
                onChange={(value) => {
                  const currentTime = appointmentForm.appointmentDate ? dayjs(appointmentForm.appointmentDate).format('HH:mm') : '08:00';
                  setAppointmentForm((current) => ({
                    ...current,
                    appointmentDate: value ? `${value.format('YYYY-MM-DD')}T${currentTime}` : '',
                  }));
                }}
              />

              <TextField
                label="Hora"
                select
                fullWidth
                value={appointmentForm.appointmentDate ? dayjs(appointmentForm.appointmentDate).format('HH:mm') : '08:00'}
                error={!!scheduleValidation.timeError}
                helperText={scheduleValidation.timeError}
                onChange={(e) => {
                  const currentDate = appointmentForm.appointmentDate
                    ? dayjs(appointmentForm.appointmentDate).format('YYYY-MM-DD')
                    : dayjs().format('YYYY-MM-DD');
                  setAppointmentForm((current) => ({
                    ...current,
                    appointmentDate: `${currentDate}T${e.target.value}`,
                  }));
                }}
              >
                {appointmentHourOptions.map((hour) => (
                  <MenuItem
                    key={hour}
                    value={hour}
                    disabled={isAppointmentSlotTaken(selectedDateKey, hour, appointments, selectedAppointment.id)}
                  >
                    {hour}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Estado"
                select
                fullWidth
                value={appointmentForm.status}
                onChange={(e) => setAppointmentForm((current) => ({ ...current, status: e.target.value }))}
              >
                {statusOptions.map((status) => (
                  <MenuItem key={status} value={status}>{status}</MenuItem>
                ))}
              </TextField>

              <TextField
                label="Motivo"
                fullWidth
                multiline
                minRows={3}
                value={appointmentForm.reason}
                onChange={(e) => setAppointmentForm((current) => ({ ...current, reason: e.target.value }))}
              />
            </Box>

            <Box sx={{ mt: 'auto', display: 'flex', flexDirection: 'column', gap: 2, pt: 3 }}>
              <Button
                variant="contained"
                onClick={handleUpdateAppointment}
                disabled={isSavingAppointment || !appointmentForm.appointmentDate || !appointmentForm.reason.trim() || !scheduleValidation.isValid}
                sx={{
                  height: 52,
                  borderRadius: '12px',
                  fontWeight: 800,
                  textTransform: 'none',
                  backgroundColor: '#4F8CFF',
                  '&:hover': { backgroundColor: '#3B82F6' },
                }}
              >
                {isSavingAppointment ? 'Guardando...' : 'Guardar cambios'}
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={handleDeleteAppointment}
                disabled={isDeletingAppointment}
                sx={{
                  height: 52,
                  borderRadius: '12px',
                  fontWeight: 800,
                  textTransform: 'none',
                  borderColor: '#FECACA',
                  backgroundColor: '#FFF5F5',
                  '&:hover': { borderColor: '#F87171', backgroundColor: '#FEE2E2' },
                }}
              >
                {isDeletingAppointment ? 'Eliminando...' : 'Eliminar cita'}
              </Button>
            </Box>
          </>
        )}
      </Drawer>

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
            onChange={(e) => setDraftFilters((current) => ({ ...current, name: e.target.value }))}
            InputProps={{
              endAdornment: <InputAdornment position="end"><Search size={18} /></InputAdornment>,
            }}
          />
          <GenericInput
            labelTitle="Riesgo o lugar"
            placeholder="Buscar riesgo o lugar"
            value={draftFilters.code}
            onChange={(e) => setDraftFilters((current) => ({ ...current, code: e.target.value }))}
          />
          <GenericInput
            labelTitle="Fecha"
            placeholder="DD/MM/AAAA"
            value={draftFilters.startDate}
            error={!!filterErrors.startDate}
            helperText={filterErrors.startDate}
            onChange={(e) => {
              setFilterErrors((current) => ({ ...current, startDate: undefined }));
              setDraftFilters((current) => ({ ...current, startDate: e.target.value }));
            }}
          />
          <GenericInput
            labelTitle="Hora"
            placeholder="08:30 AM"
            value={draftFilters.endDate}
            error={!!filterErrors.endDate}
            helperText={filterErrors.endDate}
            onChange={(e) => {
              setFilterErrors((current) => ({ ...current, endDate: undefined }));
              setDraftFilters((current) => ({ ...current, endDate: e.target.value }));
            }}
          />

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
        <Card sx={{ px: 2.5, py: 1.5, borderRadius: '14px', border: `1px solid ${snackbar.severity === 'success' ? '#BBF7D0' : snackbar.severity === 'warning' ? '#FDE68A' : '#FECACA'}`, backgroundColor: '#FFFFFF' }}>
          <Typography sx={{ fontWeight: 700, color: snackbar.severity === 'success' ? '#166534' : snackbar.severity === 'warning' ? '#92400E' : '#B91C1C' }}>
            {snackbar.message}
          </Typography>
        </Card>
      </Snackbar>
    </DashboardLayout>
  );
};

export default AppointmentsPage;
