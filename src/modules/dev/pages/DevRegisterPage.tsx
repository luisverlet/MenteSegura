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

const phq9Questions = [
  "Poco interés o placer en hacer las cosas.",
  "Se ha sentido decaído/a, deprimido/a o sin esperanzas.",
  "Problemas en dormirse o en mantenerse dormido/a, o en dormir demasiado.",
  "Se ha sentido cansado/a o con poca energía.",
  "Tener poco apetito o comer en exceso.",
  "Sentirse mal consigo mismo/a — o sentir que es un fracaso o que se ha fallado a sí mismo/a o a su familia.",
  "Dificultad para concentrarse en las cosas, tales como leer el periódico o ver la televisión.",
  "¿Se ha movido o hablado tan despacio que otras personas se hayan podido dar cuenta? O al contrario, ¿ha estado tan inquieto/a o agitado/a que se ha movido mucho más de lo normal?",
  "Pensamientos de que estaría mejor muerto/a o de lastimarse de alguna manera."
];
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import DashboardLayout from '@/core/components/layout/DashboardLayout';
import { UserPlus, ChevronDown, ClipboardCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';

const studentSchema = z.object({
  name: z.string().min(2, 'Nombre requerido'),
  last_name: z.string().min(2, 'Apellido requerido'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  student_code: z.string().min(5, 'Código requerido'),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato debe ser YYYY-MM-DD (ej: 2000-06-17)'),
  gender: z.string().min(1, 'Género requerido'),
  faculty: z.number().int(),
  program: z.number().int(),
  semester: z.number().int(),
  accepted_informed_consent: z.boolean(),
  consent_version: z.string()
});

type StudentForm = z.infer<typeof studentSchema>;

const DevRegisterPage = () => {
  const [status, setStatus] = React.useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [phq9Status, setPhq9Status] = React.useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [students, setStudents] = React.useState<any[]>([]);
  const [faculties, setFaculties] = React.useState<any[]>([]);
  const [programs, setPrograms] = React.useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = React.useState<string>('');
  const [studentPassword, setStudentPassword] = React.useState<string>('');
  const [phq9Data, setPhq9Data] = React.useState<Record<string, number>>({});
  const [isLoadingStudents, setIsLoadingStudents] = React.useState(false);
  const [isSubmittingPhq9, setIsSubmittingPhq9] = React.useState(false);
  const phq9Ref = React.useRef<HTMLDivElement>(null);

  const router = useRouter();

  const scrollToPhq9 = () => {
    phq9Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const fetchData = async () => {
    setIsLoadingStudents(true);
    const token = localStorage.getItem('auth_token');
    try {
      const [studentsRes, usersRes, facRes, progRes] = await Promise.all([
        fetch('/api/proxy/students', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/proxy/users', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/proxy/faculties', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/proxy/programs', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      if (studentsRes.ok && usersRes.ok) {
        const data = await studentsRes.json();
        const studentsList = Array.isArray(data) ? data : (data.items || []);
        const usersList = await usersRes.json();
        
        const usersMap = new Map(usersList.map((u: any[]) => [u[0], `${u[1]} ${u[2]}`]));
        
        const mapped = studentsList.map((s: any[]) => ({
          id: s[0],
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
        setPrograms(Array.isArray(data) ? data : (data.items || []));
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
    formState: { errors },
    reset
  } = useForm<StudentForm>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      faculty: 1,
      program: 1,
      semester: 1,
      gender: 'Male',
      accepted_informed_consent: true,
      consent_version: 'v1'
    }
  });

  const onSubmit = async (data: StudentForm) => {
    setStatus(null);
    const token = localStorage.getItem('auth_token');
    try {
      const response = await fetch('/api/proxy/register', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setStatus({ type: 'success', message: 'Estudiante registrado. Redirigiendo a verificación...' });
        fetchData(); // Refresh list
        setTimeout(() => {
          router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
        }, 1500);
      } else {
        const errorData = await response.json();
        setStatus({ type: 'error', message: `Error: ${JSON.stringify(errorData.detail || errorData)}` });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Error de conexión con el servidor' });
    }
  };

  const handlePhq9Submit = async () => {
    if (!selectedStudent || !studentPassword) {
      setPhq9Status({ type: 'error', message: 'Selecciona un estudiante e ingresa su contraseña' });
      setTimeout(scrollToPhq9, 100);
      return;
    }
    
    if (Object.keys(phq9Data).length < 9) {
      setPhq9Status({ type: 'error', message: 'Responde las 9 preguntas' });
      setTimeout(scrollToPhq9, 100);
      return;
    }

    setPhq9Status(null);
    setIsSubmittingPhq9(true);
    try {
      // 1. Get the student email
      const student = students.find(s => s.id === selectedStudent);
      const email = student?.email;

      // 2. Login as student to get their token
      const loginRes = await fetch('/api/proxy/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: studentPassword }),
      });

      if (!loginRes.ok) {
        throw new Error('No se pudo autenticar como estudiante. Revisa la contraseña.');
      }

      const { access_token } = await loginRes.json();

      // 3. Submit PHQ9 with student token
      const response = await fetch('/api/proxy/predict', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`
        },
        body: JSON.stringify(phq9Data),
      });

      if (response.ok) {
        const result = await response.json();
        const prob = (result.probabilidad * 100).toFixed(1);
        const riskClass = result.clase === 1 ? 'Riesgo Detectado' : 'Sin Riesgo Significativo';

        setPhq9Status({ 
          type: 'success', 
          message: `¡Formulario procesado! \n• Resultado: ${riskClass} \n• Probabilidad: ${prob}% \n• Puntaje Total: ${result.total_score}/27`
        });
        setPhq9Data({});
        setStudentPassword('');
        setTimeout(scrollToPhq9, 100);
      } else {
        const errorData = await response.json();
        setPhq9Status({ type: 'error', message: `Error en predicción: ${JSON.stringify(errorData.detail || errorData)}` });
        setTimeout(scrollToPhq9, 100);
      }
    } catch (error: any) {
      setPhq9Status({ type: 'error', message: error.message || 'Error de conexión' });
      setTimeout(scrollToPhq9, 100);
    } finally {
      setIsSubmittingPhq9(false);
    }
  };

  return (
    <DashboardLayout title="Herramientas de Desarrollo" subtitle="Pruebas de registro y formularios" Icon={UserPlus}>
      <Box sx={{ maxWidth: 900, mx: 'auto', mt: 2, display: 'flex', flexDirection: 'column', gap: 4, pb: 8 }}>
        
        {/* Section 1: Register */}
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
                <TextField {...register('password')} label="Contraseña" type="password" fullWidth error={!!errors.password} helperText={errors.password?.message} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField {...register('student_code')} label="Código Estudiantil" fullWidth error={!!errors.student_code} helperText={errors.student_code?.message} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField 
                  {...register('birth_date')} 
                  label="Fecha Nacimiento" 
                  type="date"
                  fullWidth 
                  InputLabelProps={{ shrink: true }}
                  error={!!errors.birth_date} 
                  helperText={errors.birth_date?.message} 
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField {...register('gender')} defaultValue="" label="Género" select fullWidth error={!!errors.gender}>
                  <MenuItem value="" disabled>Seleccionar Género</MenuItem>
                  <MenuItem value="Male">Masculino</MenuItem>
                  <MenuItem value="Female">Femenino</MenuItem>
                  <MenuItem value="Other">Otro</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField {...register('faculty', { valueAsNumber: true })} defaultValue="" label="Facultad" select fullWidth error={!!errors.faculty}>
                  <MenuItem value="" disabled>Seleccionar Facultad</MenuItem>
                  {faculties.length > 0 ? faculties.map((f: any[]) => (
                    <MenuItem key={f[0]} value={f[0]}>{f[1]}</MenuItem>
                  )) : (
                    <MenuItem value={1}>Facultad 1</MenuItem>
                  )}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField {...register('program', { valueAsNumber: true })} defaultValue="" label="Programa" select fullWidth error={!!errors.program}>
                  <MenuItem value="" disabled>Seleccionar Programa</MenuItem>
                  {programs.length > 0 ? programs.map((p: any[]) => (
                    <MenuItem key={p[0]} value={p[0]}>{p[1]}</MenuItem>
                  )) : (
                    <MenuItem value={1}>Programa 1</MenuItem>
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

        {/* Section 2: Form Simulation */}
        <Accordion ref={phq9Ref} sx={{ borderRadius: '16px !important', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', overflow: 'hidden', '&:before': { display: 'none' } }}>
          <AccordionSummary expandIcon={<ChevronDown size={20} />}>
            <Typography variant="h6" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
              <ClipboardCheck size={20} /> Simular Formulario de Estudiante (PHQ-9)
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 4 }}>
            {phq9Status && (
              <Alert 
                severity={phq9Status.type} 
                sx={{ 
                  mb: 3, 
                  borderRadius: '12px',
                  '& .MuiAlert-message': { whiteSpace: 'pre-line', fontWeight: 600 }
                }}
              >
                {phq9Status.message}
              </Alert>
            )}

            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>1. Selecciona un estudiante:</Typography>
                <TextField
                  select
                  fullWidth
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  placeholder="Buscar estudiante..."
                  InputProps={{
                    startAdornment: isLoadingStudents && <CircularProgress size={20} sx={{ mr: 1 }} />
                  }}
                >
                  {students.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>2. Ingresa su contraseña:</Typography>
                <TextField
                  type="password"
                  fullWidth
                  value={studentPassword}
                  onChange={(e) => setStudentPassword(e.target.value)}
                  placeholder="Contraseña del estudiante"
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Typography variant="body1" sx={{ mb: 4, fontWeight: 700, color: '#64748B' }}>
              Durante las últimas 2 semanas, ¿con qué frecuencia ha experimentado los siguientes problemas?
            </Typography>

            <Stack spacing={4}>
              {phq9Questions.map((q, i) => (
                <FormControl key={i} component="fieldset">
                  <FormLabel sx={{ fontWeight: 800, color: '#1E293B', mb: 1.5 }}>{i + 1}. {q}</FormLabel>
                  <RadioGroup
                    row
                    value={phq9Data[`question${i + 1}`] ?? ''}
                    onChange={(e) => setPhq9Data(prev => ({ ...prev, [`question${i + 1}`]: parseInt(e.target.value) }))}
                  >
                    {[0, 1, 2, 3].map((val) => (
                      <FormControlLabel
                        key={val}
                        value={val}
                        control={<Radio sx={{ color: '#4F8CFF' }} />}
                        label={
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>
                            {val === 0 && "Ningún día"}
                            {val === 1 && "Varios días"}
                            {val === 2 && "Más de la mitad"}
                            {val === 3 && "Casi todos"}
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
              {isSubmittingPhq9 ? <CircularProgress size={24} color="inherit" /> : 'Enviar Formulario (Predecir)'}
            </Button>
          </AccordionDetails>
        </Accordion>

      </Box>
    </DashboardLayout>
  );
};

export default DevRegisterPage;
