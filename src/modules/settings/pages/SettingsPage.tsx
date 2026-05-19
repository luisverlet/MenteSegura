'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Tabs,
  Tab,
  Grid,
  TextField,
  Button,
  MenuItem,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider,
  Drawer,
  IconButton,
  Snackbar,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { Settings, User, Shield, BookOpen, Plus, Pencil, Trash2, Users, GraduationCap, X } from 'lucide-react';
import DashboardLayout from '@/core/components/layout/DashboardLayout';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { clearFetchCache, fetchWithRetry } from '@/core/utils/network';
import { buildNetworkError, buildRequestError } from '@/core/utils/request-feedback';

interface ProgramForm {
  name: string;
  faculty_id: number;
}

interface FacultyForm {
  name: string;
}

interface EditableUser {
  id: number;
  name: string;
  last_name: string;
  email: string;
  role_id: number;
  status?: string;
}

interface EditableStudent {
  id: number;
  code: string;
  user_id?: number;
  name: string;
  email: string;
  contact?: string;
  program_id?: number;
  program?: string;
  faculty?: string;
}

interface FacultyItem {
  id: number;
  name: string;
}

interface ProgramItem {
  id: number;
  name: string;
  faculty_id: number;
}

const normalizeArrayPayload = (payload: any) => (Array.isArray(payload) ? payload : (payload?.items || []));

const parseNumericValue = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const formatAccountStatus = (status: string | null | undefined) => {
  const normalized = String(status || '').toLowerCase().trim();
  if (!normalized) return '';
  if (normalized.includes('pending') || normalized.includes('pendiente') || normalized.includes('verificacion')) {
    return 'Pendiente';
  }
  if (normalized.includes('active') || normalized.includes('activo')) {
    return 'Activo';
  }
  return normalized.charAt(0).toUpperCase() + normalized.slice(1).replace(/_/g, ' ');
};

const parseFaculty = (faculty: any): FacultyItem => {
  if (Array.isArray(faculty)) {
    return {
      id: parseNumericValue(faculty[0], 0),
      name: faculty[1] || 'Facultad sin nombre',
    };
  }

  return {
    id: parseNumericValue(faculty?.id, 0),
    name: faculty?.name || 'Facultad sin nombre',
  };
};

const parseProgram = (program: any): ProgramItem => {
  if (Array.isArray(program)) {
    return {
      id: parseNumericValue(program[0], 0),
      name: program[1] || 'Programa sin nombre',
      faculty_id: parseNumericValue(program[2], 0),
    };
  }

  return {
    id: parseNumericValue(program?.id, 0),
    name: program?.name || 'Programa sin nombre',
    faculty_id: parseNumericValue(program?.faculty_id, 0),
  };
};

const parseUser = (user: any): EditableUser => {
  if (Array.isArray(user)) {
    return {
      id: parseNumericValue(user[0], 0),
      name: user[1] || '',
      last_name: user[2] || '',
      email: user[3] || '',
      role_id: parseNumericValue(user[4], 2),
      status: user[5] || '',
    };
  }

  return {
    id: parseNumericValue(user?.id || user?.user_id, 0),
    name: user?.name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    role_id: parseNumericValue(user?.role_id, 2),
    status: user?.status || user?.estado || '',
  };
};

const parseStudent = (
  student: any,
  userMap: Map<number, EditableUser>,
  programMap: Map<number, ProgramItem>,
  facultyMap: Map<number, FacultyItem>
): EditableStudent => {
  if (Array.isArray(student)) {
    const userId = Number(student[1]);
    const linkedUser = userMap.get(userId);
    const programId = parseNumericValue(student[4], 0);
    const program = programMap.get(programId);
    const faculty = program ? facultyMap.get(program.faculty_id) : undefined;
    return {
      id: Number(student[0]),
      user_id: userId,
      code: student[2] || 'N/A',
      name: linkedUser ? `${linkedUser.name} ${linkedUser.last_name}`.trim() : 'Estudiante Desconocido',
      email: linkedUser?.email || 'Sin correo',
      contact: student[3] || linkedUser?.status || 'No disponible',
      program_id: programId || undefined,
      program: program?.name || 'No disponible',
      faculty: faculty?.name || 'No disponible',
    };
  }

  const linkedUser = userMap.get(Number(student?.user_id));
  const programId = parseNumericValue(student?.program_id || student?.id_programa, 0);
  const program = programMap.get(programId);
  const faculty = program ? facultyMap.get(program.faculty_id) : undefined;
  return {
    id: Number(student?.id || student?.student_id || 0),
    user_id: Number(student?.user_id || 0),
    code: student?.student_code || student?.code || 'N/A',
    name: linkedUser ? `${linkedUser.name} ${linkedUser.last_name}`.trim() : (student?.name || 'Estudiante Desconocido'),
    email: linkedUser?.email || student?.email || 'Sin correo',
    contact: student?.contact || student?.phone || student?.telefono || 'No disponible',
    program_id: programId || undefined,
    program: program?.name || student?.program || 'No disponible',
    faculty: faculty?.name || student?.faculty || 'No disponible',
  };
};

const decodeTokenPayload = (token: string) => {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
};

const resolveLoggedUser = (users: EditableUser[], token: string) => {
  const payload = decodeTokenPayload(token);
  const candidateEmail = String(payload?.email || payload?.sub || '').toLowerCase().trim();
  const numericCandidates = [
    Number(payload?.user_id),
    Number(payload?.id),
    Number(payload?.sub),
  ].filter((value) => !Number.isNaN(value) && value > 0);

  if (candidateEmail) {
    const byEmail = users.find((user) => user.email.toLowerCase().trim() === candidateEmail);
    if (byEmail) return byEmail;
  }

  if (numericCandidates.length > 0) {
    const byId = users.find((user) => numericCandidates.includes(user.id));
    if (byId) return byId;
  }

  return users[0] || null;
};

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const [faculties, setFaculties] = useState<FacultyItem[]>([]);
  const [programs, setPrograms] = useState<ProgramItem[]>([]);
  const [users, setUsers] = useState<EditableUser[]>([]);
  const [students, setStudents] = useState<EditableStudent[]>([]);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'warning' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [profileUser, setProfileUser] = useState<EditableUser | null>(null);
  const [selectedUser, setSelectedUser] = useState<EditableUser | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<EditableStudent | null>(null);
  const [userDrawerOpen, setUserDrawerOpen] = useState(false);
  const [studentDrawerOpen, setStudentDrawerOpen] = useState(false);
  const [isLoadingAdmin, setIsLoadingAdmin] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [isDeletingStudent, setIsDeletingStudent] = useState(false);
  const [editingOwnProfile, setEditingOwnProfile] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    intent: 'primary' | 'danger';
    action: null | 'update-user' | 'delete-user' | 'delete-student';
  }>({
    open: false,
    title: '',
    message: '',
    confirmLabel: '',
    intent: 'primary',
    action: null,
  });
  const [userForm, setUserForm] = useState({
    name: '',
    last_name: '',
    email: '',
    role_id: '2',
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProgramForm>({
    defaultValues: { faculty_id: 0 }
  });
  const {
    register: registerFaculty,
    handleSubmit: handleFacultySubmit,
    reset: resetFaculty,
    formState: { errors: facultyErrors }
  } = useForm<FacultyForm>({
    defaultValues: { name: '' }
  });

  const facultyMap = useMemo(
    () => new Map<number, string>(faculties.map((faculty) => [faculty.id, faculty.name])),
    [faculties]
  );

  const studentUserIds = useMemo(
    () => new Set(students.map((student) => student.user_id).filter((value): value is number => typeof value === 'number' && value > 0)),
    [students]
  );

  const manageableUsers = useMemo(
    () => users.filter((user) => user.id !== profileUser?.id && user.role_id !== 1 && !studentUserIds.has(user.id)),
    [users, profileUser, studentUserIds]
  );

  const fetchProfileData = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setProfileError('No encontramos una sesion activa para cargar tu perfil.');
      setIsLoadingProfile(false);
      return;
    }

    setIsLoadingProfile(true);
    setProfileError('');

    try {
      const usersRes = await fetchWithRetry('/api/proxy/users', { headers: { Authorization: `Bearer ${token}` } });
      if (usersRes.ok) {
        const data = await usersRes.json();
        const parsedUsers: EditableUser[] = normalizeArrayPayload(data).map(parseUser);
        setUsers(parsedUsers);
        const loggedUser = resolveLoggedUser(parsedUsers, token);
        setProfileUser(loggedUser);
        if (!loggedUser) {
          setProfileError('No pudimos identificar el usuario de la sesion actual.');
        }
      } else {
        setProfileError(await buildRequestError(usersRes, 'No pudimos cargar tu perfil.'));
      }
    } catch (error) {
      console.error(error);
      setProfileError(buildNetworkError('tu perfil'));
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const fetchAdminData = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setSnackbar({ open: true, message: 'No encontramos una sesion activa para cargar la administracion.', severity: 'error' });
      return;
    }

    setIsLoadingAdmin(true);

    try {
      const [facRes, progRes, usersRes, studentsRes] = await Promise.all([
        fetchWithRetry('/api/proxy/faculties', { headers: { Authorization: `Bearer ${token}` } }),
        fetchWithRetry('/api/proxy/programs', { headers: { Authorization: `Bearer ${token}` } }),
        fetchWithRetry('/api/proxy/users', { headers: { Authorization: `Bearer ${token}` } }),
        fetchWithRetry('/api/proxy/students?page=1&limit=100', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const errors: string[] = [];
      let parsedUsers: EditableUser[] = [];
      let parsedFaculties: FacultyItem[] = [];
      let parsedPrograms: ProgramItem[] = [];

      if (facRes.ok) {
        const data = await facRes.json();
        parsedFaculties = normalizeArrayPayload(data).map(parseFaculty);
        setFaculties(parsedFaculties);
      } else {
        errors.push(await buildRequestError(facRes, 'No pudimos cargar las facultades.'));
      }

      if (progRes.ok) {
        const data = await progRes.json();
        parsedPrograms = normalizeArrayPayload(data).map(parseProgram);
        setPrograms(parsedPrograms);
      } else {
        errors.push(await buildRequestError(progRes, 'No pudimos cargar los programas.'));
      }

      if (usersRes.ok) {
        const data = await usersRes.json();
        parsedUsers = normalizeArrayPayload(data).map(parseUser);
        setUsers(parsedUsers);
        const loggedUser = resolveLoggedUser(parsedUsers, token);
        setProfileUser(loggedUser);
      } else {
        errors.push(await buildRequestError(usersRes, 'No pudimos cargar los usuarios.'));
      }

      if (studentsRes.ok) {
        const data = await studentsRes.json();
        const studentEntries = normalizeArrayPayload(data);
        const userMap = new Map<number, EditableUser>((parsedUsers.length ? parsedUsers : users).map((user: EditableUser) => [user.id, user]));
        const programMap = new Map<number, ProgramItem>((parsedPrograms.length ? parsedPrograms : programs).map((program) => [program.id, program]));
        const facultyLookup = new Map<number, FacultyItem>((parsedFaculties.length ? parsedFaculties : faculties).map((faculty) => [faculty.id, faculty]));
        setStudents(studentEntries.map((student: any) => parseStudent(student, userMap, programMap, facultyLookup)));
      } else {
        errors.push(await buildRequestError(studentsRes, 'No pudimos cargar los estudiantes.'));
      }

      if (errors.length > 0) {
        setSnackbar({ open: true, message: errors.join(' '), severity: 'warning' });
      }
    } catch (error) {
      console.error(error);
      setSnackbar({ open: true, message: buildNetworkError('los datos de administracion'), severity: 'error' });
    } finally {
      setIsLoadingAdmin(false);
    }
  };

  useEffect(() => {
    if (activeTab === 0) {
      fetchProfileData();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 1) {
      fetchAdminData();
    }
    // fetchAdminData intentionally reads the latest local state as a fallback for partial API responses.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const onSubmitProgram = async (data: ProgramForm) => {
    setStatus(null);
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetchWithRetry('/api/proxy/create_program', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        setStatus({ type: 'success', msg: 'Programa creado correctamente' });
        reset();
        fetchAdminData();
      } else {
        const message = await buildRequestError(res, 'No pudimos crear el programa academico.');
        setStatus({ type: 'error', msg: message });
      }
    } catch {
      setStatus({ type: 'error', msg: buildNetworkError('la creacion del programa') });
    }
  };

  const onSubmitFaculty = async (data: FacultyForm) => {
    setStatus(null);
    const token = localStorage.getItem('auth_token');

    try {
      const res = await fetchWithRetry('/api/proxy/create_faculty', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        setStatus({ type: 'success', msg: 'Facultad creada correctamente' });
        resetFaculty();
        fetchAdminData();
      } else {
        const message = await buildRequestError(res, 'No pudimos crear la facultad.');
        setStatus({ type: 'error', msg: message });
      }
    } catch {
      setStatus({ type: 'error', msg: buildNetworkError('la creacion de la facultad') });
    }
  };

  const openUserEditor = (user: EditableUser, options?: { ownProfile?: boolean }) => {
    setSelectedUser(user);
    setEditingOwnProfile(Boolean(options?.ownProfile));
    setUserForm({
      name: user.name,
      last_name: user.last_name,
      email: user.email,
      role_id: String(user.role_id),
    });
    setPasswordForm({
      current_password: '',
      new_password: '',
      confirm_password: '',
    });
    setUserDrawerOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    const token = localStorage.getItem('auth_token');

    if (editingOwnProfile && (passwordForm.current_password || passwordForm.new_password || passwordForm.confirm_password)) {
      if (!passwordForm.current_password || !passwordForm.new_password || !passwordForm.confirm_password) {
        setSnackbar({ open: true, message: 'Completa todos los campos de contrasena para actualizarla.', severity: 'error' });
        return;
      }

      if (passwordForm.new_password.length < 6) {
        setSnackbar({ open: true, message: 'La nueva contrasena debe tener al menos 6 caracteres.', severity: 'error' });
        return;
      }

      if (passwordForm.new_password !== passwordForm.confirm_password) {
        setSnackbar({ open: true, message: 'La confirmacion de la nueva contrasena no coincide.', severity: 'error' });
        return;
      }
    }

    setIsSavingUser(true);

    try {
      const res = await fetchWithRetry(`/api/proxy/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: userForm.name,
          last_name: userForm.last_name,
          email: userForm.email,
          role_id: Number(userForm.role_id),
        }),
      });

      if (res.ok) {
        if (editingOwnProfile && passwordForm.current_password && passwordForm.new_password) {
          const passwordResponse = await fetchWithRetry('/api/proxy/change-password', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              current_password: passwordForm.current_password,
              new_password: passwordForm.new_password,
            }),
          });

          if (!passwordResponse.ok) {
            const message = await buildRequestError(passwordResponse, 'No pudimos actualizar la contrasena.');
            setSnackbar({ open: true, message, severity: 'error' });
            return;
          }
        }

        setSnackbar({
          open: true,
          message: editingOwnProfile
            ? (passwordForm.new_password ? 'Tu perfil y contrasena fueron actualizados correctamente.' : 'Tu perfil fue actualizado correctamente.')
            : 'Usuario actualizado correctamente.',
          severity: 'success'
        });
        setUserDrawerOpen(false);
        setPasswordForm({
          current_password: '',
          new_password: '',
          confirm_password: '',
        });
        await fetchProfileData();
        if (activeTab === 1) {
          await fetchAdminData();
        }
      } else {
        const message = await buildRequestError(res, 'No pudimos actualizar el usuario.');
        setSnackbar({ open: true, message, severity: 'error' });
      }
    } catch {
      setSnackbar({ open: true, message: buildNetworkError('la actualizacion del usuario'), severity: 'error' });
    } finally {
      setIsSavingUser(false);
    }
  };

  const requestUpdateConfirmation = () => {
    setConfirmDialog({
      open: true,
      title: editingOwnProfile ? 'Confirmar actualizacion de perfil' : 'Confirmar actualizacion de usuario',
      message: editingOwnProfile
        ? 'Se guardaran los cambios de tu perfil. Confirma para continuar.'
        : 'Se guardaran los cambios del usuario seleccionado. Confirma para continuar.',
      confirmLabel: 'Confirmar cambios',
      intent: 'primary',
      action: 'update-user',
    });
  };

  const requestDeleteUserConfirmation = (user: EditableUser) => {
    setSelectedUser(user);
    setConfirmDialog({
      open: true,
      title: 'Confirmar eliminacion de usuario',
      message: `Se eliminara la cuenta de ${`${user.name} ${user.last_name}`.trim()}. Esta accion no se puede deshacer.`,
      confirmLabel: 'Eliminar usuario',
      intent: 'danger',
      action: 'delete-user',
    });
  };

  const requestDeleteStudentConfirmation = (student: EditableStudent) => {
    setSelectedStudent(student);
    setConfirmDialog({
      open: true,
      title: 'Confirmar eliminacion de estudiante',
      message: `Se eliminara el estudiante ${student.name}. Esta accion no se puede deshacer.`,
      confirmLabel: 'Eliminar estudiante',
      intent: 'danger',
      action: 'delete-student',
    });
  };

  const handleConfirmAction = async () => {
    if (confirmDialog.action === 'update-user') {
      setConfirmDialog((current) => ({ ...current, open: false }));
      await handleUpdateUser();
      return;
    }

    if (confirmDialog.action === 'delete-user' && selectedUser) {
      setConfirmDialog((current) => ({ ...current, open: false }));
      await handleDeleteUser(selectedUser);
      return;
    }

    if (confirmDialog.action === 'delete-student' && selectedStudent) {
      setConfirmDialog((current) => ({ ...current, open: false }));
      await handleDeleteStudent(selectedStudent);
    }
  };

  const handleDeleteUser = async (user: EditableUser) => {
    const token = localStorage.getItem('auth_token');
    setIsDeletingUser(true);

    try {
      const res = await fetchWithRetry(`/api/proxy/delete-user/${user.id}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
      }, 3, 500, { cache: false });

      if (res.ok) {
        clearFetchCache();
        setSnackbar({ open: true, message: 'Usuario eliminado correctamente.', severity: 'success' });
        setUserDrawerOpen(false);
        fetchAdminData();
      } else {
        const message = await buildRequestError(res, 'No pudimos eliminar el usuario.');
        setSnackbar({ open: true, message, severity: 'error' });
      }
    } catch {
      setSnackbar({ open: true, message: buildNetworkError('la eliminacion del usuario'), severity: 'error' });
    } finally {
      setIsDeletingUser(false);
    }
  };

  const handleDeleteStudent = async (student: EditableStudent) => {
    const token = localStorage.getItem('auth_token');
    setIsDeletingStudent(true);

    try {
      const res = await fetchWithRetry(`/api/proxy/delete-student/${student.id}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
      }, 3, 500, { cache: false });

      if (res.ok) {
        clearFetchCache();
        setSnackbar({ open: true, message: 'Estudiante eliminado correctamente.', severity: 'success' });
        setStudentDrawerOpen(false);
        fetchAdminData();
      } else {
        const message = await buildRequestError(res, 'No pudimos eliminar el estudiante.');
        setSnackbar({ open: true, message, severity: 'error' });
      }
    } catch {
      setSnackbar({ open: true, message: buildNetworkError('la eliminacion del estudiante'), severity: 'error' });
    } finally {
      setIsDeletingStudent(false);
    }
  };

  return (
    <DashboardLayout title="Configuracion" subtitle="Perfil y Administracion" Icon={Settings}>
      <Box sx={{ maxWidth: 1100, mx: 'auto', mt: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(_, value) => setActiveTab(value)}
          sx={{ mb: 4, '& .MuiTab-root': { fontWeight: 700, textTransform: 'none', fontSize: '16px' } }}
        >
          <Tab icon={<User size={20} />} iconPosition="start" label="Mi Perfil" />
          <Tab icon={<Shield size={20} />} iconPosition="start" label="Administracion" />
        </Tabs>

        {activeTab === 0 && (
          <Card sx={{ p: 4, borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>
              Mi perfil
            </Typography>

            {isLoadingProfile ? (
              <Typography sx={{ color: '#64748B', fontWeight: 600 }}>
                Cargando tu perfil...
              </Typography>
            ) : profileError ? (
              <Alert severity="error" sx={{ borderRadius: '12px' }}>
                {profileError}
              </Alert>
            ) : profileUser ? (
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField label="Nombre" value={profileUser.name} fullWidth disabled />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField label="Apellidos" value={profileUser.last_name} fullWidth disabled />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField label="Correo" value={profileUser.email} fullWidth disabled />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField label="Rol" value={profileUser.role_id === 1 ? 'Administrador' : 'Usuario'} fullWidth disabled />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Button
                    variant="contained"
                    onClick={() => openUserEditor(profileUser, { ownProfile: true })}
                    sx={{ borderRadius: '12px', fontWeight: 700, backgroundColor: '#4F8CFF' }}
                  >
                    Editar mi perfil
                  </Button>
                </Grid>
              </Grid>
            ) : (
              <Typography sx={{ color: '#64748B', fontSize: '16px', fontWeight: 600 }}>
                No pudimos identificar el usuario de la sesion actual.
              </Typography>
            )}
          </Card>
        )}

        {activeTab === 1 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Card sx={{ p: 4, borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>Herramientas de Desarrollo</Typography>
                <Typography sx={{ color: '#64748B', fontSize: '14px' }}>Acceso rapido al simulador de estudiantes y evaluaciones.</Typography>
              </Box>
              <Button
                variant="outlined"
                onClick={() => router.push('/dev-register')}
                sx={{ borderRadius: '12px', fontWeight: 700, borderColor: '#E2E8F0', color: '#334155' }}
              >
                Ir a Registro de Estudiantes
              </Button>
            </Card>

            <Card sx={{ p: 4, borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <BookOpen size={20} /> Crear Facultad
              </Typography>
              <Typography sx={{ color: '#64748B', mb: 3, fontSize: '14px' }}>
                Anade una nueva facultad para organizar programas academicos.
              </Typography>

              {status && (
                <Alert severity={status.type} sx={{ mb: 3, borderRadius: '8px' }}>
                  {status.msg}
                </Alert>
              )}

              <form onSubmit={handleFacultySubmit(onSubmitFaculty)}>
                <Grid container spacing={3} alignItems="flex-end">
                  <Grid size={{ xs: 12, md: 9 }}>
                    <TextField
                      {...registerFaculty('name', { required: 'El nombre es obligatorio' })}
                      label="Nombre de la Facultad"
                      fullWidth
                      error={!!facultyErrors.name}
                      helperText={facultyErrors.name?.message}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      fullWidth
                      startIcon={<Plus size={20} />}
                      sx={{ height: 56, fontWeight: 'bold', backgroundColor: '#4F8CFF', '&:hover': { backgroundColor: '#3b82f6' } }}
                    >
                      Crear
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </Card>

            <Card sx={{ p: 4, borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <BookOpen size={20} /> Crear Programa Academico
              </Typography>
              <Typography sx={{ color: '#64748B', mb: 3, fontSize: '14px' }}>
                Anade un nuevo programa a una facultad existente.
              </Typography>

              {status && (
                <Alert severity={status.type} sx={{ mb: 3, borderRadius: '8px' }}>
                  {status.msg}
                </Alert>
              )}

              <form onSubmit={handleSubmit(onSubmitProgram)}>
                <Grid container spacing={3} alignItems="flex-end">
                  <Grid size={{ xs: 12, md: 5 }}>
                    <TextField
                      {...register('name', { required: 'El nombre es obligatorio' })}
                      label="Nombre del Programa"
                      fullWidth
                      error={!!errors.name}
                      helperText={errors.name?.message}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      {...register('faculty_id', { valueAsNumber: true })}
                      defaultValue=""
                      label="Facultad"
                      select
                      fullWidth
                      SelectProps={{ MenuProps: { PaperProps: { style: { maxHeight: 200 } } } }}
                    >
                      <MenuItem value="" disabled>Seleccionar Facultad</MenuItem>
                      {faculties.length > 0 ? faculties.map((faculty) => (
                        <MenuItem key={faculty.id} value={faculty.id}>{faculty.name}</MenuItem>
                      )) : (
                        <MenuItem value={0} disabled>No hay facultades disponibles</MenuItem>
                      )}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      fullWidth
                      startIcon={<Plus size={20} />}
                      sx={{ height: 56, fontWeight: 'bold', backgroundColor: '#4F8CFF', '&:hover': { backgroundColor: '#3b82f6' } }}
                    >
                      Crear
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </Card>

            <Grid container spacing={4}>
              <Grid size={{ xs: 12, lg: 6 }}>
                <Card sx={{ p: 4, borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Users size={20} /> Gestion de Usuarios
                  </Typography>
                  {isLoadingAdmin ? (
                    <Typography sx={{ color: '#64748B', fontWeight: 600 }}>Cargando usuarios...</Typography>
                  ) : (
                    <List sx={{ width: '100%', bgcolor: 'background.paper', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                      {manageableUsers.length > 0 ? manageableUsers.map((user, index) => (
                        <React.Fragment key={user.id}>
                          <ListItem
                            secondaryAction={
                              <Stack direction="row" spacing={1}>
                                <IconButton onClick={() => openUserEditor(user, { ownProfile: false })} sx={{ color: '#4F8CFF' }}>
                                  <Pencil size={18} />
                                </IconButton>
                                <IconButton onClick={() => requestDeleteUserConfirmation(user)} sx={{ color: '#EF4444' }}>
                                  <Trash2 size={18} />
                                </IconButton>
                              </Stack>
                            }
                          >
                            <ListItemText
                              primary={<Typography sx={{ fontWeight: 700 }}>{`${user.name} ${user.last_name}`.trim()}</Typography>}
                              secondary={`${user.email}${user.status ? ` | ${formatAccountStatus(user.status)}` : ''}`}
                            />
                          </ListItem>
                          {index < manageableUsers.length - 1 && <Divider />}
                        </React.Fragment>
                      )) : (
                        <ListItem><ListItemText primary="No hay usuarios no administradores registrados" /></ListItem>
                      )}
                    </List>
                  )}
                </Card>
              </Grid>

              <Grid size={{ xs: 12, lg: 6 }}>
                <Card sx={{ p: 4, borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <GraduationCap size={20} /> Gestion de Estudiantes
                  </Typography>
                  {isLoadingAdmin ? (
                    <Typography sx={{ color: '#64748B', fontWeight: 600 }}>Cargando estudiantes...</Typography>
                  ) : (
                    <List sx={{ width: '100%', bgcolor: 'background.paper', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                      {students.length > 0 ? students.map((student, index) => (
                        <React.Fragment key={student.id}>
                          <ListItem
                            onClick={() => { setSelectedStudent(student); setStudentDrawerOpen(true); }}
                            sx={{ cursor: 'pointer' }}
                            secondaryAction={
                              <Stack direction="row" spacing={1}>
                                <IconButton onClick={() => requestDeleteStudentConfirmation(student)} sx={{ color: '#EF4444' }}>
                                  <Trash2 size={18} />
                                </IconButton>
                              </Stack>
                            }
                          >
                            <ListItemText
                              primary={<Typography sx={{ fontWeight: 700 }}>{student.name}</Typography>}
                              secondary={`${student.code} | ${student.email}`}
                            />
                          </ListItem>
                          {index < students.length - 1 && <Divider />}
                        </React.Fragment>
                      )) : (
                        <ListItem><ListItemText primary="No hay estudiantes registrados" /></ListItem>
                      )}
                    </List>
                  )}
                </Card>
              </Grid>
            </Grid>

            <Card sx={{ p: 4, borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>Programas Existentes</Typography>
              <List sx={{ width: '100%', bgcolor: 'background.paper', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                {programs.length > 0 ? programs.map((program, index) => (
                  <React.Fragment key={program.id}>
                    <ListItem>
                      <ListItemText
                        primary={<Typography sx={{ fontWeight: 700 }}>{program.name}</Typography>}
                        secondary={facultyMap.get(program.faculty_id) || 'Facultad sin asignar'}
                      />
                    </ListItem>
                    {index < programs.length - 1 && <Divider />}
                  </React.Fragment>
                )) : (
                  <ListItem><ListItemText primary="No hay programas registrados" /></ListItem>
                )}
              </List>
            </Card>
          </Box>
        )}
      </Box>

      <Drawer anchor="right" open={userDrawerOpen} onClose={() => setUserDrawerOpen(false)} PaperProps={{ sx: { width: { xs: '100%', sm: 420 }, p: 4 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>{editingOwnProfile ? 'Editar mi perfil' : 'Editar usuario'}</Typography>
          <IconButton onClick={() => setUserDrawerOpen(false)}><X size={22} /></IconButton>
        </Box>

        <Stack spacing={3}>
          <TextField label="Nombre" value={userForm.name} onChange={(e) => setUserForm((current) => ({ ...current, name: e.target.value }))} fullWidth />
          <TextField label="Apellidos" value={userForm.last_name} onChange={(e) => setUserForm((current) => ({ ...current, last_name: e.target.value }))} fullWidth />
          <TextField label="Correo" value={userForm.email} onChange={(e) => setUserForm((current) => ({ ...current, email: e.target.value }))} fullWidth />
          {editingOwnProfile ? (
            <TextField label="Rol" value={userForm.role_id === '1' ? 'Administrador' : 'Usuario'} fullWidth disabled />
          ) : (
            <TextField label="Rol" select value={userForm.role_id} onChange={(e) => setUserForm((current) => ({ ...current, role_id: e.target.value }))} fullWidth>
              <MenuItem value="1">Administrador</MenuItem>
              <MenuItem value="2">Usuario</MenuItem>
            </TextField>
          )}

          {editingOwnProfile && (
            <>
              <Divider />
              <Typography sx={{ fontWeight: 800, color: '#1E293B', fontSize: '15px' }}>
                Cambiar contrasena
              </Typography>
              <TextField
                label="Contrasena actual"
                type="password"
                value={passwordForm.current_password}
                onChange={(e) => setPasswordForm((current) => ({ ...current, current_password: e.target.value }))}
                fullWidth
              />
              <TextField
                label="Nueva contrasena"
                type="password"
                value={passwordForm.new_password}
                onChange={(e) => setPasswordForm((current) => ({ ...current, new_password: e.target.value }))}
                fullWidth
              />
              <TextField
                label="Confirmar nueva contrasena"
                type="password"
                value={passwordForm.confirm_password}
                onChange={(e) => setPasswordForm((current) => ({ ...current, confirm_password: e.target.value }))}
                fullWidth
              />
            </>
          )}

          <Button variant="contained" onClick={requestUpdateConfirmation} disabled={isSavingUser} sx={{ height: 52, borderRadius: '12px', fontWeight: 700, backgroundColor: '#4F8CFF' }}>
            {isSavingUser ? 'Guardando...' : 'Guardar cambios'}
          </Button>
          {selectedUser && !editingOwnProfile && (
            <Button variant="outlined" color="error" onClick={() => requestDeleteUserConfirmation(selectedUser)} disabled={isDeletingUser} sx={{ height: 52, borderRadius: '12px', fontWeight: 700 }}>
              {isDeletingUser ? 'Eliminando...' : 'Eliminar usuario'}
            </Button>
          )}
        </Stack>
      </Drawer>

      <Drawer anchor="right" open={studentDrawerOpen} onClose={() => setStudentDrawerOpen(false)} PaperProps={{ sx: { width: { xs: '100%', sm: 400 }, p: 4 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>Detalle del estudiante</Typography>
          <IconButton onClick={() => setStudentDrawerOpen(false)}><X size={22} /></IconButton>
        </Box>

        {selectedStudent && (
          <Stack spacing={3}>
            <TextField label="Codigo" value={selectedStudent.code} fullWidth disabled />
            <TextField label="Programa" value={selectedStudent.program || 'No disponible'} fullWidth disabled />
            <TextField label="Facultad" value={selectedStudent.faculty || 'No disponible'} fullWidth disabled />
            <TextField label="Correo" value={selectedStudent.email} fullWidth disabled />
            <TextField label="Contacto" value={selectedStudent.contact || 'No disponible'} fullWidth disabled />
            <Button variant="outlined" color="error" onClick={() => requestDeleteStudentConfirmation(selectedStudent)} disabled={isDeletingStudent} sx={{ height: 52, borderRadius: '12px', fontWeight: 700 }}>
              {isDeletingStudent ? 'Eliminando...' : 'Eliminar estudiante'}
            </Button>
          </Stack>
        )}
      </Drawer>

      <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog((current) => ({ ...current, open: false }))} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>{confirmDialog.title}</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: '#475569', fontWeight: 500 }}>
            {confirmDialog.message}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            variant="outlined"
            onClick={() => setConfirmDialog((current) => ({ ...current, open: false }))}
            sx={{ borderRadius: '12px', fontWeight: 700 }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmAction}
            color={confirmDialog.intent === 'danger' ? 'error' : 'primary'}
            sx={{
              borderRadius: '12px',
              fontWeight: 700,
              backgroundColor: confirmDialog.intent === 'danger' ? undefined : '#4F8CFF',
            }}
          >
            {confirmDialog.confirmLabel}
          </Button>
        </DialogActions>
      </Dialog>

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
}
