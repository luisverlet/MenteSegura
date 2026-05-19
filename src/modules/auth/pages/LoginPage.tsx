'use client';

import React from 'react';
import NextLink from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Card,
  TextField,
  Button,
  Link,
  InputAdornment,
  IconButton,
  Snackbar,
  Alert,
  Backdrop,
  CircularProgress,
} from '@mui/material';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import * as styles from './login.styles';
import { fetchWithRetry } from '@/core/utils/network';
import { extractAuthError, mapAuthNetworkError } from '@/modules/auth/utils/auth-feedback';

const loginSchema = z.object({
  email: z.string().min(1, 'El correo electronico es obligatorio').email('Email invalido'),
  password: z.string().min(6, 'La contrasena debe tener al menos 6 caracteres'),
});

type LoginForm = z.infer<typeof loginSchema>;

const LoginPage = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isWakingServer, setIsWakingServer] = React.useState(false);
  const [errorSnackbar, setErrorSnackbar] = React.useState({ open: false, message: '' });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  React.useEffect(() => {
    router.prefetch('/dashboard');
  }, [router]);

  const warmDashboardCache = React.useCallback((token: string) => {
    const headers = { Authorization: `Bearer ${token}` };

    void Promise.allSettled([
      fetchWithRetry('/api/proxy/dashboard/stats?period=Mes', { headers }),
      fetchWithRetry('/api/proxy/programs', { headers }),
      fetchWithRetry('/api/proxy/students', { headers }),
      fetchWithRetry('/api/proxy/users', { headers }),
    ]);
  }, []);

  const onSubmit = async (data: LoginForm) => {
    setIsSubmitting(true);
    setIsWakingServer(false);

    try {
      const response = await fetchWithRetry(
        '/api/proxy/login',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: data.email,
            password: data.password,
          }),
        },
        3,
        1200,
        {
          onRetry: ({ status, attempt }) => {
            if ([502, 503, 504].includes(status ?? 0) || attempt > 1) {
              setIsWakingServer(true);
            }
          },
        }
      );

      if (response.ok) {
        const responseData = await response.json();
        if (responseData.access_token) {
          localStorage.setItem('auth_token', responseData.access_token);
          warmDashboardCache(responseData.access_token);
          router.replace('/dashboard');
          return;
        }

        setErrorSnackbar({ open: true, message: 'El servidor no envio una sesion valida. Intenta iniciar sesion nuevamente.' });
        return;
      }

      const { userMessage } = await extractAuthError(response);
      setErrorSnackbar({ open: true, message: userMessage });
    } catch (error) {
      console.error('Error de inicio de sesion', error);
      setErrorSnackbar({ open: true, message: mapAuthNetworkError('login') });
    } finally {
      setIsSubmitting(false);
      setIsWakingServer(false);
    }
  };

  const handleCloseSnackbar = () => {
    setErrorSnackbar((current) => ({ ...current, open: false }));
  };

  return (
    <Box sx={styles.pageWrapperStyles}>
      <Card sx={styles.loginCardStyles}>
        <Box sx={styles.illustrationPanelStyles}>
          <Image
            src="/assets/login.svg"
            alt="Ilustracion de inicio de sesion"
            width={550}
            height={550}
            priority
          />
        </Box>

        <Box sx={styles.formPanelStyles}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              textAlign: 'center',
              mb: 6,
              color: '#1E293B',
            }}
          >
            Bienvenido
          </Typography>

          <form onSubmit={handleSubmit(onSubmit)}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', mb: 1, display: 'block' }}>
                Correo electronico
              </Typography>
              <TextField
                {...register('email')}
                placeholder="ejemplo@correo.com"
                error={!!errors.email}
                helperText={errors.email?.message}
                disabled={isSubmitting}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Box sx={styles.iconBoxStyles}>
                        <Mail size={20} />
                      </Box>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', mb: 1, display: 'block' }}>
                Contrasena
              </Typography>
              <TextField
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="**********"
                error={!!errors.password}
                helperText={errors.password?.message}
                disabled={isSubmitting}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Box sx={styles.iconBoxStyles}>
                        <Lock size={20} />
                      </Box>
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" disabled={isSubmitting}>
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 4 }}>
              <Link component={NextLink} href="/forgot-password" sx={{ fontWeight: 700, fontSize: '14px', color: '#4F8CFF', textDecoration: 'none' }}>
                Olvidaste tu contrasena?
              </Link>
            </Box>

            <Button type="submit" variant="contained" fullWidth sx={styles.loginButtonStyles} disabled={isSubmitting}>
              {isSubmitting ? 'Ingresando...' : 'Iniciar sesion'}
            </Button>

            <Typography variant="body2" sx={{ textAlign: 'center', fontWeight: 600, color: '#64748B', mt: 3 }}>
              No tienes cuenta?{' '}
              <Link component={NextLink} href="/register" sx={{ color: '#4F8CFF', textDecoration: 'none', fontWeight: 800 }}>
                Crea una
              </Link>
            </Typography>
          </form>
        </Box>
      </Card>

      <Snackbar open={errorSnackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
          {errorSnackbar.message}
        </Alert>
      </Snackbar>

      <Backdrop open={isSubmitting && isWakingServer} sx={styles.loadingBackdropStyles}>
        <Box sx={styles.loadingCardStyles}>
          <Box sx={styles.loadingSpinnerWrapStyles}>
            <CircularProgress size={38} thickness={4.5} sx={{ color: '#4F8CFF' }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#1E293B', mb: 1.5 }}>
            Iniciando servidor de Render
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748B', lineHeight: 1.7 }}>
            Este primer ingreso puede tardar un poco mientras el backend se activa. Estamos intentando conectarnos automaticamente.
          </Typography>
        </Box>
      </Backdrop>
    </Box>
  );
};

export default LoginPage;
