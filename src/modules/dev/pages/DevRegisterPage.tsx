'use client';

import React from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
  Divider,
  CircularProgress,
  Stack
} from '@mui/material';
import dayjs from 'dayjs';

const phq9Questions = [
  'Poco interes o placer en hacer las cosas.',
  'Se ha sentido decaido/a, deprimido/a o sin esperanzas.',
  'Problemas en dormirse o en mantenerse dormido/a, o en dormir demasiado.',
  'Se ha sentido cansado/a o con poca energia.',
  'Tener poco apetito o comer en exceso.',
  'Sentirse mal consigo mismo/a o sentir que es un fracaso o que se ha fallado a si mismo/a o a su familia.',
  'Dificultad para concentrarse en las cosas, tales como leer el periodico o ver la television.',
  'Se ha movido o hablado tan despacio que otras personas se hayan podido dar cuenta? O al contrario, ha estado tan inquieto/a o agitado/a que se ha movido mucho mas de lo normal?',
  'Pensamientos de que estaria mejor muerto/a o de lastimarse de alguna manera.'
];

const gad7Questions = [
  'Sentirse nervioso/a, ansioso/a o muy alterado/a.',
  'No poder dejar de preocuparse o no poder controlar la preocupacion.',
  'Preocuparse demasiado por diferentes cosas.',
  'Tener dificultad para relajarse.',
  'Estar tan inquieto/a que es dificil permanecer quieto/a.',
  'Irritarse o enfadarse con facilidad.',
  'Sentir miedo, como si algo terrible pudiera pasar.'
];

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import DashboardLayout from '@/core/components/layout/DashboardLayout';
import { UserPlus, ChevronDown, ClipboardCheck, CalendarDays, ShieldAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { fetchWithRetry } from '@/core/utils/network';
import { extractAuthError, mapAuthNetworkError } from '@/modules/auth/utils/auth-feedback';
import { buildRequestError, buildNetworkError } from '@/core/utils/request-feedback';
import { formatRisk } from '@/core/utils/formatters';
import FormDatePicker from '@/core/components/FormDatePicker';
import {
  AppointmentSlot,
  isAppointmentSlotTaken,
  normalizeDateKeyFromIso,
  validateAppointmentSchedule,
  parseDateInput,
} from '@/core/utils/date-time-validation';

const appointmentHourOptions = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

const normalizeArrayPayload = (payload: any) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const extractAppointmentDate = (appointment: any) =>
  (Array.isArray(appointment) ? appointment[2] || appointment[3] : null) ||
  appointment?.appointment_date ||
  appointment?.date ||
  appointment?.fecha ||
  appointment?.scheduled_at ||
  '';

const parseAppointmentSlot = (appointment: any, index: number): AppointmentSlot | null => {
  const appointmentDateIso = extractAppointmentDate(appointment);
  if (!appointmentDateIso) return null;

  return {
    id: Number(appointment?.id || appointment?.appointment_id || appointment?.id_cita || index + 1),
    appointmentDateIso,
  };
};

const studentSchema = z.object({
  name: z.string().min(2, 'Nombre requerido'),
  last_name: z.string().min(2, 'Apellido requerido'),
  email: z.string().email('Email invalido'),
  password: z.string().min(6, 'Minimo 6 caracteres'),
  student_code: z.string().min(5, 'Codigo requerido'),
  birth_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato debe ser YYYY-MM-DD (ej: 2000-06-17)')
    .refine((value) => !parseDateInput(value).error, 'Ingresa una fecha de nacimiento valida')
    .refine((value) => {
      const parsed = parseDateInput(value);
      return !parsed.date || parsed.date <= new Date();
    }, 'La fecha de nacimiento no puede estar en el futuro'),
  gender: z.string().min(1, 'Genero requerido'),
  faculty: z.number().int().min(1, 'Selecciona una facultad'),
  program: z.number().int().min(1, 'Selecciona un programa'),
  semester: z.number().int(),
  accepted_informed_consent: z.boolean(),
  consent_version: z.string()
});

type StudentForm = z.infer<typeof studentSchema>;

const DevRegisterPage = () => {
  const [status, setStatus] = React.useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [phq9Status, setPhq9Status] = React.useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [gad7Status, setGad7Status] = React.useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [appointmentStatus, setAppointmentStatus] = React.useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [authStatus, setAuthStatus] = React.useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);
  const [students, setStudents] = React.useState<any[]>([]);
  const [faculties, setFaculties] = React.useState<any[]>([]);
  const [programs, setPrograms] = React.useState<any[]>([]);
  const [appointments, setAppointments] = React.useState<AppointmentSlot[]>([]);
  const [selectedStudent, setSelectedStudent] = React.useState<string>('');
  const [studentPassword, setStudentPassword] = React.useState<string>('');
  const [studentAccessToken, setStudentAccessToken] = React.useState<string>('');
  const [authenticatedStudentId, setAuthenticatedStudentId] = React.useState<string>('');
  const [phq9Data, setPhq9Data] = React.useState<Record<string, number>>({});
  const [gad7Data, setGad7Data] = React.useState<Record<string, number>>({});
  const [appointmentDate, setAppointmentDate] = React.useState('');
  const [appointmentReason, setAppointmentReason] = React.useState('');
  const [isLoadingStudents, setIsLoadingStudents] = React.useState(false);
  const [isAuthenticatingStudent, setIsAuthenticatingStudent] = React.useState(false);
  const [isSubmittingPhq9, setIsSubmittingPhq9] = React.useState(false);
  const [isSubmittingGad7, setIsSubmittingGad7] = React.useState(false);
  const [isSubmittingAppointment, setIsSubmittingAppointment] = React.useState(false);
  const phq9Ref = React.useRef<HTMLDivElement>(null);

  const router = useRouter();

  const scrollToForms = () => {
    phq9Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const normalizePredictError = (message: string, formName: 'PHQ-9' | 'GAD-7') => {
    const normalized = message.toLowerCase();

    if (
      normalized.includes('could not parse `na`') ||
      normalized.includes('csv parsing') ||
      normalized.includes('dtype') ||
      normalized.includes('narcissism')
    ) {
      return `El backend de ${formName} fallo al procesar el modelo de prediccion. Parece un problema interno con el archivo de entrenamiento o sus tipos de datos.`;
    }

    return message;
  };

  const resetStudentSession = React.useCallback(() => {
    setStudentAccessToken('');
    setAuthenticatedStudentId('');
    setAuthStatus(null);
  }, []);

  const fetchData = async () => {
    setIsLoadingStudents(true);
    const token = localStorage.getItem('auth_token');
    try {
      const [studentsRes, usersRes, facRes, progRes, appointmentsRes] = await Promise.all([
        fetchWithRetry('/api/proxy/students', { headers: { Authorization: `Bearer ${token}` } }),
        fetchWithRetry('/api/proxy/users', { headers: { Authorization: `Bearer ${token}` } }),
        fetchWithRetry('/api/proxy/faculties', { headers: { Authorization: `Bearer ${token}` } }),
        fetchWithRetry('/api/proxy/programs', { headers: { Authorization: `Bearer ${token}` } }),
        fetchWithRetry('/api/proxy/appointments', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (studentsRes.ok && usersRes.ok) {
        const data = await studentsRes.json();
        const studentsList = Array.isArray(data) ? data : (data.items || []);
        const rawUsers = await usersRes.json();
        const usersList = Array.isArray(rawUsers) ? rawUsers : (rawUsers.items || []);

        const usersMap = new Map(usersList.map((u: any[]) => [u[0], `${u[1]} ${u[2]}`]));

        const mapped = studentsList.map((s: any[]) => ({
          id: String(s[0]),
          name: usersMap.get(s[1]) || 'Estudiante Desconocido',
          code: s[2],
          email: usersList.find((u: any[]) => u[0] === s[1])?.[3]
        }));
        setStudents(mapped);
      }

      if (facRes.ok) {
        const data = await facRes.json();
        setFaculties(Array.isArray(data) ? data : (data.items || []));
      }

      if (progRes.ok) {
        const data = await progRes.json();
        setPrograms(normalizeArrayPayload(data));
      }

      if (appointmentsRes.ok) {
        const data = await appointmentsRes.json();
        setAppointments(
          normalizeArrayPayload(data)
            .map(parseAppointmentSlot)
            .filter((slot: AppointmentSlot | null): slot is AppointmentSlot => Boolean(slot))
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<StudentForm>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      faculty: 0,
      program: 0,
      semester: 1,
      gender: 'Male',
      accepted_informed_consent: true,
      consent_version: 'v1'
    }
  });

  const selectedFaculty = useWatch({ control, name: 'faculty' });
  const selectedProgram = useWatch({ control, name: 'program' });

  const filteredPrograms = React.useMemo(() => {
    if (!selectedFaculty || Number.isNaN(selectedFaculty)) return [];
    return programs.filter((program: any[]) => Number(program[2]) === Number(selectedFaculty));
  }, [programs, selectedFaculty]);

  React.useEffect(() => {
    const isProgramValid = filteredPrograms.some((program: any[]) => Number(program[0]) === Number(selectedProgram));

    if (!isProgramValid) {
      setValue('program', 0);
    }
  }, [filteredPrograms, selectedProgram, setValue]);

  const selectedAppointmentDateKey = normalizeDateKeyFromIso(appointmentDate);
  const appointmentValidation = React.useMemo(
    () => validateAppointmentSchedule(appointmentDate, appointments),
    [appointmentDate, appointments]
  );

  const onSubmit = async (data: StudentForm) => {
    setStatus(null);
    const token = localStorage.getItem('auth_token');
    try {
      const response = await fetchWithRetry('/api/proxy/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setStatus({ type: 'success', message: 'Estudiante registrado. Redirigiendo a verificacion...' });
        fetchData();
        setTimeout(() => {
          router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
        }, 1500);
      } else {
        const message = await buildRequestError(response, 'No pudimos registrar el estudiante.');
        setStatus({ type: 'error', message });
      }
    } catch {
      setStatus({ type: 'error', message: buildNetworkError('el registro del estudiante') });
    }
  };

  const authenticateStudent = async () => {
    if (!selectedStudent || !studentPassword) {
      setAuthStatus({ type: 'error', message: 'Selecciona un estudiante e ingresa su contrasena.' });
      setTimeout(scrollToForms, 100);
      return null;
    }

    if (studentAccessToken && authenticatedStudentId === selectedStudent) {
      return studentAccessToken;
    }

    setIsAuthenticatingStudent(true);
    setAuthStatus(null);

    try {
      const student = students.find((item) => item.id === selectedStudent);
      const email = student?.email;
      if (!email) {
        throw new Error('No encontramos el correo del estudiante seleccionado.');
      }

      const loginRes = await fetchWithRetry('/api/proxy/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: studentPassword }),
      });

      if (!loginRes.ok) {
        const { userMessage } = await extractAuthError(loginRes);
        throw new Error(userMessage);
      }

      const { access_token } = await loginRes.json();
      setStudentAccessToken(access_token);
      setAuthenticatedStudentId(selectedStudent);
      setAuthStatus({ type: 'success', message: 'Sesion del estudiante autenticada. Ya puedes resolver formularios y pedir la cita sin volver a ingresar la contrasena.' });
      return access_token;
    } catch (error: any) {
      const message = error?.message || mapAuthNetworkError('login');
      setAuthStatus({ type: 'error', message });
      setTimeout(scrollToForms, 100);
      return null;
    } finally {
      setIsAuthenticatingStudent(false);
    }
  };

  const ensureStudentToken = async () => {
    const token = await authenticateStudent();
    return token;
  };

  const handlePhq9Submit = async () => {
    if (Object.keys(phq9Data).length < 9) {
      setPhq9Status({ type: 'error', message: 'Responde las 9 preguntas del PHQ-9.' });
      setTimeout(scrollToForms, 100);
      return;
    }

    setPhq9Status(null);
    setIsSubmittingPhq9(true);

    try {
      const token = await ensureStudentToken();
      if (!token) return;

      const response = await fetchWithRetry('/api/proxy/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(phq9Data),
      });

      if (response.ok) {
        const result = await response.json();
        const prob = (result.probabilidad * 100).toFixed(1);
        const riskClass = result.clase === 1 ? 'Riesgo Detectado' : 'Sin Riesgo Significativo';

        setPhq9Status({
          type: 'success',
          message: `Formulario PHQ-9 procesado.\n• Resultado: ${riskClass}\n• Probabilidad: ${prob}%\n• Puntaje Total: ${result.total_score}/27`
        });
        setPhq9Data({});
        setTimeout(scrollToForms, 100);
      } else {
        const message = await buildRequestError(response, 'No pudimos procesar el formulario PHQ-9.');
        setPhq9Status({ type: 'error', message });
        setTimeout(scrollToForms, 100);
      }
    } catch (error: any) {
      setPhq9Status({ type: 'error', message: error.message || buildNetworkError('el formulario PHQ-9') });
      setTimeout(scrollToForms, 100);
    } finally {
      setIsSubmittingPhq9(false);
    }
  };

  const handleGad7Submit = async () => {
    if (Object.keys(gad7Data).length < 7) {
      setGad7Status({ type: 'error', message: 'Responde las 7 preguntas del GAD-7.' });
      setTimeout(scrollToForms, 100);
      return;
    }

    setGad7Status(null);
    setIsSubmittingGad7(true);

    try {
      const token = await ensureStudentToken();
      if (!token) return;

      const response = await fetchWithRetry('/api/proxy/predict_anxiety', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(gad7Data),
      });

      if (response.ok) {
        const result = await response.json();
        const probabilityValue = typeof result?.probabilidad === 'number'
          ? `${(result.probabilidad * 100).toFixed(1)}%`
          : 'Sin probabilidad';
        const scoreValue = result?.total_score !== undefined && result?.total_score !== null
          ? `${result.total_score}/21`
          : 'Sin puntaje';
        const riskClass =
          result?.clase === 1
            ? 'Riesgo Detectado'
            : result?.clase === 0
              ? 'Sin Riesgo Significativo'
              : formatRisk(result?.risk || result?.current_risk || 'Sin datos');

        setGad7Status({
          type: 'success',
          message: `Formulario GAD-7 procesado.\n• Resultado: ${riskClass}\n• Probabilidad: ${probabilityValue}\n• Puntaje Total: ${scoreValue}`
        });
        setGad7Data({});
        setTimeout(scrollToForms, 100);
      } else {
        const message = await buildRequestError(response, 'No pudimos procesar el formulario GAD-7.');
        setGad7Status({ type: 'error', message: normalizePredictError(message, 'GAD-7') });
        setTimeout(scrollToForms, 100);
      }
    } catch (error: any) {
      const fallbackMessage = error.message || buildNetworkError('el formulario GAD-7');
      setGad7Status({ type: 'error', message: normalizePredictError(fallbackMessage, 'GAD-7') });
      setTimeout(scrollToForms, 100);
    } finally {
      setIsSubmittingGad7(false);
    }
  };

  const handleAppointmentSubmit = async () => {
    if (!appointmentDate || !appointmentReason.trim()) {
      setAppointmentStatus({ type: 'error', message: 'Completa la fecha y el motivo de la cita.' });
      setTimeout(scrollToForms, 100);
      return;
    }

    if (!appointmentValidation.isValid) {
      setAppointmentStatus({ type: 'error', message: appointmentValidation.message || 'Revisa la fecha y hora de la cita.' });
      setTimeout(scrollToForms, 100);
      return;
    }

    setAppointmentStatus(null);
    setIsSubmittingAppointment(true);

    try {
      const token = await ensureStudentToken();
      if (!token) return;

      const response = await fetchWithRetry('/api/proxy/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          appointment_date: new Date(appointmentDate).toISOString(),
          reason: appointmentReason.trim(),
        }),
      });

      if (response.ok) {
        setAppointmentStatus({ type: 'success', message: 'Cita solicitada correctamente.' });
        setAppointmentDate('');
        setAppointmentReason('');
        fetchData();
        setTimeout(scrollToForms, 100);
      } else {
        const message = await buildRequestError(response, 'No pudimos registrar la cita.');
        setAppointmentStatus({ type: 'error', message });
        setTimeout(scrollToForms, 100);
      }
    } catch (error: any) {
      setAppointmentStatus({ type: 'error', message: error.message || buildNetworkError('la solicitud de la cita') });
      setTimeout(scrollToForms, 100);
    } finally {
      setIsSubmittingAppointment(false);
    }
  };

  return (
    <DashboardLayout title="Herramientas de Desarrollo" subtitle="Pruebas de registro y formularios" Icon={UserPlus}>
      <Box sx={{ maxWidth: 900, mx: 'auto', mt: 2, display: 'flex', flexDirection: 'column', gap: 4, pb: 8 }}>

        <Box sx={{ p: 3, backgroundColor: '#FFF', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
            <UserPlus size={20} /> Registrar Nuevo Estudiante
          </Typography>

          {status && (
            <Alert severity={status.type} sx={{ mb: 3, borderRadius: '8px' }}>
              {status.message}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField {...register('name')} label="Nombre" fullWidth error={!!errors.name} helperText={errors.name?.message} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField {...register('last_name')} label="Apellidos" fullWidth error={!!errors.last_name} helperText={errors.last_name?.message} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField {...register('email')} label="Email" fullWidth error={!!errors.email} helperText={errors.email?.message} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField {...register('password')} label="Contrasena" type="password" fullWidth error={!!errors.password} helperText={errors.password?.message} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField {...register('student_code')} label="Codigo Estudiantil" fullWidth error={!!errors.student_code} helperText={errors.student_code?.message} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  {...register('birth_date')}
                  label="Fecha Nacimiento"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ max: dayjs().format('YYYY-MM-DD') }}
                  error={!!errors.birth_date}
                  helperText={errors.birth_date?.message}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField {...register('gender')} defaultValue="" label="Genero" select fullWidth error={!!errors.gender}>
                  <MenuItem value="" disabled>Seleccionar Genero</MenuItem>
                  <MenuItem value="Male">Masculino</MenuItem>
                  <MenuItem value="Female">Femenino</MenuItem>
                  <MenuItem value="Other">Otro</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField {...register('faculty', { valueAsNumber: true })} defaultValue="" label="Facultad" select fullWidth error={!!errors.faculty}>
                  <MenuItem value={0} disabled>Seleccionar Facultad</MenuItem>
                  {faculties.length > 0 ? faculties.map((f: any[]) => (
                    <MenuItem key={f[0]} value={f[0]}>{f[1]}</MenuItem>
                  )) : (
                    <MenuItem value={0} disabled>No hay facultades disponibles</MenuItem>
                  )}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField {...register('program', { valueAsNumber: true })} defaultValue="" label="Programa" select fullWidth error={!!errors.program}>
                  <MenuItem value={0} disabled>Seleccionar Programa</MenuItem>
                  {filteredPrograms.length > 0 ? filteredPrograms.map((p: any[]) => (
                    <MenuItem key={p[0]} value={p[0]}>{p[1]}</MenuItem>
                  )) : (
                    <MenuItem value={0} disabled>
                      {selectedFaculty ? 'No hay programas para esta facultad' : 'Selecciona una facultad primero'}
                    </MenuItem>
                  )}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField {...register('semester', { valueAsNumber: true })} label="Semestre" type="number" fullWidth error={!!errors.semester} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormControlLabel
                  control={<Checkbox {...register('accepted_informed_consent')} defaultChecked />}
                  label="Acepta consentimiento informado"
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Button type="submit" variant="contained" fullWidth size="large" sx={{ py: 1.5, fontWeight: 'bold', backgroundColor: '#4F8CFF', '&:hover': { backgroundColor: '#3A7BD5' } }}>
                  Registrar Estudiante
                </Button>
              </Grid>
            </Grid>
          </form>
        </Box>

        <Accordion ref={phq9Ref} sx={{ borderRadius: '16px !important', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', overflow: 'hidden', '&:before': { display: 'none' } }}>
          <AccordionSummary expandIcon={<ChevronDown size={20} />}>
            <Typography variant="h6" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
              <ClipboardCheck size={20} /> Simular Formularios y Citas del Estudiante
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 4 }}>
            {authStatus && (
              <Alert severity={authStatus.type} sx={{ mb: 3, borderRadius: '12px', '& .MuiAlert-message': { fontWeight: 600 } }}>
                {authStatus.message}
              </Alert>
            )}

            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid size={{ xs: 12, sm: 5 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>1. Selecciona un estudiante:</Typography>
                <TextField
                  select
                  fullWidth
                  value={selectedStudent}
                  onChange={(e) => {
                    setSelectedStudent(e.target.value);
                    resetStudentSession();
                  }}
                  InputProps={{
                    startAdornment: isLoadingStudents && <CircularProgress size={20} sx={{ mr: 1 }} />
                  }}
                >
                  {students.map((student) => (
                    <MenuItem key={student.id} value={student.id}>
                      {student.name} ({student.code})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 5 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>2. Ingresa su contrasena:</Typography>
                <TextField
                  type="password"
                  fullWidth
                  value={studentPassword}
                  onChange={(e) => {
                    setStudentPassword(e.target.value);
                    resetStudentSession();
                  }}
                  placeholder="Contrasena del estudiante"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, opacity: 0 }}>A</Typography>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={authenticateStudent}
                  disabled={isAuthenticatingStudent}
                  sx={{ height: 56, borderRadius: '12px', fontWeight: 800, textTransform: 'none' }}
                >
                  {isAuthenticatingStudent ? <CircularProgress size={22} /> : 'Entrar'}
                </Button>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ mb: 5 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Formulario PHQ-9</Typography>

              {phq9Status && (
                <Alert severity={phq9Status.type} sx={{ mb: 3, borderRadius: '12px', '& .MuiAlert-message': { whiteSpace: 'pre-line', fontWeight: 600 } }}>
                  {phq9Status.message}
                </Alert>
              )}

              <Typography variant="body1" sx={{ mb: 4, fontWeight: 700, color: '#64748B' }}>
                Durante las ultimas 2 semanas, con que frecuencia ha experimentado los siguientes problemas?
              </Typography>

              <Stack spacing={4}>
                {phq9Questions.map((question, index) => (
                  <FormControl key={index} component="fieldset">
                    <FormLabel sx={{ fontWeight: 800, color: '#1E293B', mb: 1.5 }}>{index + 1}. {question}</FormLabel>
                    <RadioGroup
                      row
                      value={phq9Data[`question${index + 1}`] ?? ''}
                      onChange={(e) => setPhq9Data((prev) => ({ ...prev, [`question${index + 1}`]: parseInt(e.target.value, 10) }))}
                    >
                      {[0, 1, 2, 3].map((value) => (
                        <FormControlLabel
                          key={value}
                          value={value}
                          control={<Radio sx={{ color: '#4F8CFF' }} />}
                          label={
                            <Typography variant="caption" sx={{ fontWeight: 600 }}>
                              {value === 0 && 'Ningun dia'}
                              {value === 1 && 'Varios dias'}
                              {value === 2 && 'Mas de la mitad'}
                              {value === 3 && 'Casi todos'}
                            </Typography>
                          }
                          sx={{ mr: 4 }}
                        />
                      ))}
                    </RadioGroup>
                  </FormControl>
                ))}
              </Stack>

              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={handlePhq9Submit}
                disabled={isSubmittingPhq9}
                sx={{ mt: 6, py: 2, fontWeight: 800, backgroundColor: '#22C55E', '&:hover': { backgroundColor: '#16A34A' } }}
              >
                {isSubmittingPhq9 ? <CircularProgress size={24} color="inherit" /> : 'Enviar PHQ-9'}
              </Button>
            </Box>

            <Divider sx={{ my: 4 }} />

            <Box sx={{ mb: 5 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Formulario GAD-7</Typography>

              {gad7Status && (
                <Alert severity={gad7Status.type} sx={{ mb: 3, borderRadius: '12px', '& .MuiAlert-message': { whiteSpace: 'pre-line', fontWeight: 600 } }}>
                  {gad7Status.message}
                </Alert>
              )}

              <Typography variant="body1" sx={{ mb: 4, fontWeight: 700, color: '#64748B' }}>
                Durante las ultimas 2 semanas, con que frecuencia ha experimentado los siguientes problemas?
              </Typography>

              <Stack spacing={4}>
                {gad7Questions.map((question, index) => (
                  <FormControl key={index} component="fieldset">
                    <FormLabel sx={{ fontWeight: 800, color: '#1E293B', mb: 1.5 }}>{index + 1}. {question}</FormLabel>
                    <RadioGroup
                      row
                      value={gad7Data[`question${index + 1}`] ?? ''}
                      onChange={(e) => setGad7Data((prev) => ({ ...prev, [`question${index + 1}`]: parseInt(e.target.value, 10) }))}
                    >
                      {[0, 1, 2, 3].map((value) => (
                        <FormControlLabel
                          key={value}
                          value={value}
                          control={<Radio sx={{ color: '#4F8CFF' }} />}
                          label={
                            <Typography variant="caption" sx={{ fontWeight: 600 }}>
                              {value === 0 && 'Ningun dia'}
                              {value === 1 && 'Varios dias'}
                              {value === 2 && 'Mas de la mitad'}
                              {value === 3 && 'Casi todos'}
                            </Typography>
                          }
                          sx={{ mr: 4 }}
                        />
                      ))}
                    </RadioGroup>
                  </FormControl>
                ))}
              </Stack>

              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={handleGad7Submit}
                disabled={isSubmittingGad7}
                sx={{ mt: 6, py: 2, fontWeight: 800, backgroundColor: '#F59E0B', '&:hover': { backgroundColor: '#D97706' } }}
              >
                {isSubmittingGad7 ? <CircularProgress size={24} color="inherit" /> : 'Enviar GAD-7'}
              </Button>
            </Box>

            <Divider sx={{ my: 4 }} />

            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarDays size={20} /> Solicitar Cita
              </Typography>

              {appointmentStatus && (
                <Alert severity={appointmentStatus.type} sx={{ mb: 3, borderRadius: '12px', '& .MuiAlert-message': { fontWeight: 600 } }}>
                  {appointmentStatus.message}
                </Alert>
              )}

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormDatePicker
                    label="Fecha"
                    value={appointmentDate ? dayjs(appointmentDate) : null}
                    minDate={dayjs().startOf('day')}
                    error={appointmentDate ? appointmentValidation.dateError : undefined}
                    onChange={(value) => {
                      const currentTime = appointmentDate ? dayjs(appointmentDate).format('HH:mm') : '08:00';
                      setAppointmentDate(value ? `${value.format('YYYY-MM-DD')}T${currentTime}` : '');
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Hora"
                    select
                    fullWidth
                    value={appointmentDate ? dayjs(appointmentDate).format('HH:mm') : '08:00'}
                    error={!!appointmentDate && !!appointmentValidation.timeError}
                    helperText={appointmentDate ? appointmentValidation.timeError : undefined}
                    onChange={(e) => {
                      const currentDate = appointmentDate
                        ? dayjs(appointmentDate).format('YYYY-MM-DD')
                        : dayjs().format('YYYY-MM-DD');
                      setAppointmentDate(`${currentDate}T${e.target.value}`);
                    }}
                  >
                    {appointmentHourOptions.map((hour) => (
                      <MenuItem
                        key={hour}
                        value={hour}
                        disabled={isAppointmentSlotTaken(selectedAppointmentDateKey, hour, appointments)}
                      >
                        {hour}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Motivo de la cita"
                    fullWidth
                    multiline
                    minRows={3}
                    value={appointmentReason}
                    onChange={(e) => setAppointmentReason(e.target.value)}
                    placeholder="Describe el motivo de la solicitud"
                  />
                </Grid>
              </Grid>

              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={handleAppointmentSubmit}
                disabled={isSubmittingAppointment || !appointmentDate || !appointmentReason.trim() || !appointmentValidation.isValid}
                sx={{ mt: 4, py: 2, fontWeight: 800, backgroundColor: '#4F8CFF', '&:hover': { backgroundColor: '#3A7BD5' } }}
              >
                {isSubmittingAppointment ? <CircularProgress size={24} color="inherit" /> : 'Solicitar Cita'}
              </Button>
            </Box>

            <Alert severity="info" icon={<ShieldAlert size={18} />} sx={{ mt: 4, borderRadius: '12px', '& .MuiAlert-message': { fontWeight: 600 } }}>
              PHQ-9, GAD-7 y solicitud de cita ya reutilizan una sola autenticacion del estudiante.
            </Alert>
          </AccordionDetails>
        </Accordion>
      </Box>
    </DashboardLayout>
  );
};

export default DevRegisterPage;
