'use client';

import React, { useState, useEffect } from 'react';
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
  Divider
} from '@mui/material';
import { Settings, User, Shield, BookOpen, Plus, Hammer } from 'lucide-react';
import DashboardLayout from '@/core/components/layout/DashboardLayout';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { fetchWithRetry } from '@/core/utils/network';

interface ProgramForm {
  name: string;
  faculty_id: number;
}

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const [faculties, setFaculties] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [status, setStatus] = useState<{type: 'success'|'error', msg: string} | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProgramForm>({
    defaultValues: { faculty_id: 1 }
  });

  const fetchData = async () => {
    const token = localStorage.getItem('auth_token');
    try {
      const [facRes, progRes] = await Promise.all([
        fetchWithRetry('/api/proxy/faculties', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetchWithRetry('/api/proxy/programs', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
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
    }
  };

  useEffect(() => {
    if (activeTab === 1) {
      fetchData();
    }
  }, [activeTab]);

  const onSubmitProgram = async (data: ProgramForm) => {
    setStatus(null);
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetchWithRetry('/api/proxy/create_program', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        setStatus({ type: 'success', msg: 'Programa creado correctamente' });
        reset();
        fetchData(); // Refresh list
      } else {
        const err = await res.json();
        setStatus({ type: 'error', msg: `Error: ${JSON.stringify(err)}` });
      }
    } catch (error) {
      setStatus({ type: 'error', msg: 'Error de conexión' });
    }
  };

  return (
    <DashboardLayout title="Configuración" subtitle="Perfil y Administración" Icon={Settings}>
      <Box sx={{ maxWidth: 1000, mx: 'auto', mt: 2 }}>
        <Tabs 
          value={activeTab} 
          onChange={(_, v) => setActiveTab(v)} 
          sx={{ mb: 4, '& .MuiTab-root': { fontWeight: 700, textTransform: 'none', fontSize: '16px' } }}
        >
          <Tab icon={<User size={20} />} iconPosition="start" label="Mi Perfil" />
          <Tab icon={<Shield size={20} />} iconPosition="start" label="Administración" />
        </Tabs>

        {activeTab === 0 && (
          <Card sx={{ p: 8, borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', textAlign: 'center' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <Box sx={{ p: 3, backgroundColor: '#FEF3C7', borderRadius: '50%', color: '#D97706' }}>
                <Hammer size={48} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 900, color: '#1E293B' }}>
                EN CONSTRUCCIÓN
              </Typography>
              <Typography sx={{ color: '#64748B', maxWidth: 450, mx: 'auto', fontSize: '18px', fontWeight: 500 }}>
                Esta sección está siendo desarrollada. Pronto podrás gestionar toda tu información personal desde aquí.
              </Typography>
              <Alert severity="info" sx={{ mt: 2, borderRadius: '12px', fontWeight: 600 }}>
                Los endpoints del backend para la gestión de perfil aún no están disponibles.
              </Alert>
            </Box>
          </Card>
        )}

        {activeTab === 1 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Card sx={{ p: 4, borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>Herramientas de Desarrollo</Typography>
                <Typography sx={{ color: '#64748B', fontSize: '14px' }}>Acceso rápido al simulador de estudiantes y evaluaciones (Solo Desarrollo).</Typography>
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
                <BookOpen size={20} /> Crear Programa Académico
              </Typography>
              <Typography sx={{ color: '#64748B', mb: 3, fontSize: '14px' }}>
                Añade un nuevo programa a una facultad existente.
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
                      {faculties.length > 0 ? faculties.map((f: any[]) => (
                        <MenuItem key={f[0]} value={f[0]}>{f[1]}</MenuItem>
                      )) : (
                        <MenuItem value={1}>Facultad Default (ID: 1)</MenuItem>
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

            <Card sx={{ p: 4, borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
               <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>Programas Existentes</Typography>
               <List sx={{ width: '100%', bgcolor: 'background.paper', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                 {programs.length > 0 ? programs.map((p: any[], idx) => (
                   <React.Fragment key={p[0]}>
                     <ListItem>
                       <ListItemText 
                         primary={<Typography sx={{ fontWeight: 700 }}>{p[1]}</Typography>} 
                         secondary={`ID: ${p[0]} | Facultad ID: ${p[2]}`} 
                       />
                     </ListItem>
                     {idx < programs.length - 1 && <Divider />}
                   </React.Fragment>
                 )) : (
                   <ListItem><ListItemText primary="No hay programas registrados" /></ListItem>
                 )}
               </List>
            </Card>
          </Box>
        )}
      </Box>
    </DashboardLayout>
  );
}
