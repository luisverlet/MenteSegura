'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import NextLink from 'next/link';
import {
  Box,
  Typography,
  Card,
  TextField,
  Button,
  InputAdornment,
  IconButton,
  Link,
  Snackbar,
  Alert,
} from '@mui/material';
import { User, Mail, Lock, Eye } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import * as styles from './register.styles';
import { useRouter } from 'next/navigation';
import { extractAuthError, mapAuthNetworkError } from '@/modules/auth/utils/auth-feedback';

const registerSchema = z.object({
  firstName: z.string().min(2, 'El nombre es obligatorio'),
  lastName: z.string().min(2, 'Los apellidos son obligatorios'),
  email: z.string().email('Email invalido'),
  password: z.string().min(6, 'Minimo 6 caracteres'),
  confirmPassword: z.string().min(6, 'Minimo 6 caracteres'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contrasenas no coinciden',
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

const RegisterPage = () => {
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [errorSnackbar, setErrorSnackbar] = useState({ open: false, message: '' });
  const router = useRouter();

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
  });

  const handleNext = async () => {
    const isStepValid = await trigger(['firstName', 'lastName']);
    if (isStepValid) setStep(2);
  };

  const onSubmit = async (data: RegisterForm) => {
    try {
      const response = await fetch('/api/proxy/register_user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.firstName,
          last_name: data.lastName,
          email: data.email,
          password: data.password,
          role_id: 2,
        }),
      });

      if (response.ok) {
        router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
        return;
      }

      const { userMessage } = await extractAuthError(response);
      setErrorSnackbar({ open: true, message: userMessage });
    } catch (error) {
      console.error('Registration failed', error);
      setErrorSnackbar({ open: true, message: mapAuthNetworkError('register') });
    }
  };

  const handleCloseSnackbar = () => {
    setErrorSnackbar((current) => ({ ...current, open: false }));
  };

  return (
    <Box sx={styles.pageWrapperStyles}>
      <Card sx={styles.registerCardStyles}>
        <Box sx={styles.formPanelStyles}>
          <Typography variant="h4" sx={styles.stepTitleStyles}>
            Creacion de cuenta
          </Typography>

          <form onSubmit={handleSubmit(onSubmit)}>
            {step === 1 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', mb: 1, display: 'block' }}>
                    Nombre
                  </Typography>
                  <TextField
                    {...register('firstName')}
                    placeholder="Juan"
                    error={!!errors.firstName}
                    helperText={errors.firstName?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Box sx={styles.iconBoxStyles}><User size={20} /></Box>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', mb: 1, display: 'block' }}>
                    Apellidos
                  </Typography>
                  <TextField
                    {...register('lastName')}
                    placeholder="Perez"
                    error={!!errors.lastName}
                    helperText={errors.lastName?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Box sx={styles.iconBoxStyles}><User size={20} /></Box>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                <Button variant="contained" fullWidth onClick={handleNext} sx={{ ...styles.buttonStyles, backgroundColor: '#4F8CFF', mt: 2 }}>
                  Siguiente
                </Button>
              </Box>
            )}

            {step === 2 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', mb: 1, display: 'block' }}>
                    Correo electronico
                  </Typography>
                  <TextField
                    {...register('email')}
                    placeholder="ejemplo@correo.com"
                    error={!!errors.email}
                    helperText={errors.email?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Box sx={styles.iconBoxStyles}><Mail size={20} /></Box>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', mb: 1, display: 'block' }}>
                    Contrasena
                  </Typography>
                  <TextField
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="**********"
                    error={!!errors.password}
                    helperText={errors.password?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Box sx={styles.iconBoxStyles}><Lock size={20} /></Box>
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword(!showPassword)}><Eye size={20} /></IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', mb: 1, display: 'block' }}>
                    Repetir contrasena
                  </Typography>
                  <TextField
                    {...register('confirmPassword')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="**********"
                    error={!!errors.confirmPassword}
                    helperText={errors.confirmPassword?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Box sx={styles.iconBoxStyles}><Lock size={20} /></Box>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  <Button variant="contained" fullWidth onClick={() => setStep(1)} sx={{ ...styles.buttonStyles, backgroundColor: '#4F8CFF', opacity: 0.8 }}>
                    Anterior
                  </Button>
                  <Button type="submit" variant="contained" fullWidth sx={{ ...styles.buttonStyles, backgroundColor: '#4F8CFF' }}>
                    Registrar
                  </Button>
                </Box>
              </Box>
            )}

            <Typography variant="body2" sx={{ textAlign: 'center', mt: 4, fontWeight: 600, color: '#64748B' }}>
              Ya tienes cuenta?{' '}
              <Link component={NextLink} href="/login" sx={{ color: '#4F8CFF', textDecoration: 'none', fontWeight: 800 }}>
                Inicia sesion
              </Link>
            </Typography>
          </form>
        </Box>

        <Box sx={styles.illustrationPanelStyles}>
          <Image
            src="/assets/creation.svg"
            alt="Ilustracion de registro"
            width={550}
            height={550}
            priority
          />
        </Box>
      </Card>

      <Snackbar open={errorSnackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
          {errorSnackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RegisterPage;
