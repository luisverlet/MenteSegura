'use client';

import React from 'react';
import NextLink from 'next/link';
import Image from 'next/image';
import { 
  Box, 
  Typography, 
  Card, 
  TextField, 
  Button, 
  Checkbox, 
  FormControlLabel, 
  Link, 
  InputAdornment, 
  IconButton,
  Snackbar,
  Alert
} from '@mui/material';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import * as styles from './login.styles';

const loginSchema = z.object({
  email: z.string().min(1, 'El correo electrónico es obligatorio').email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type LoginForm = z.infer<typeof loginSchema>;

const LoginPage = () => {
  const [showPassword, setShowPassword] = React.useState(false);
  const [errorSnackbar, setErrorSnackbar] = React.useState<{open: boolean, message: string}>({ open: false, message: '' });

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

  const onSubmit = async (data: LoginForm) => {
    try {
      const response = await fetch('/api/proxy/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password
        }),
      });
      if (response.ok) {
        const responseData = await response.json();
        if (responseData.access_token) {
          localStorage.setItem('auth_token', responseData.access_token);
        }
        window.location.href = '/dashboard';
      } else {
        const errorData = await response.json();
        setErrorSnackbar({ open: true, message: `Error de inicio de sesión: ${errorData.message || 'Credenciales inválidas'}` });
      }
    } catch (error) {
      console.error('Error de inicio de sesión', error);
      setErrorSnackbar({ open: true, message: 'Error en el inicio de sesión' });
    }
  };

  const handleCloseSnackbar = () => {
    setErrorSnackbar({ ...errorSnackbar, open: false });
  };

  return (
    <Box sx={styles.pageWrapperStyles}>
      <Card sx={styles.loginCardStyles}>
        {/* Left Side: Illustration */}
        <Box sx={styles.illustrationPanelStyles}>
          <Image 
            src="/assets/login.svg" 
            alt="Ilustración de Inicio de Sesión" 
            width={550} 
            height={550} 
            priority 
          />
        </Box>

        {/* Right Side: Form */}
        <Box sx={styles.formPanelStyles}>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 800, 
              textAlign: 'center', 
              mb: 6, 
              color: '#1E293B' 
            }}
          >
            Bienvenido
          </Typography>

          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Email Field */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', mb: 1, display: 'block' }}>
                Correo Electrónico
              </Typography>
              <TextField 
                {...register('email')}
                placeholder="ejemplo@correo.com"
                error={!!errors.email}
                helperText={errors.email?.message}
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

            {/* Password Field */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', mb: 1, display: 'block' }}>
                Contraseña
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
                       <Box sx={styles.iconBoxStyles}>
                        <Lock size={20} />
                      </Box>
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            {/* Forgot Password */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 4 }}>
              <Link component={NextLink} href="/forgot-password" sx={{ fontWeight: 700, fontSize: '14px', color: '#4F8CFF', textDecoration: 'none' }}>
                ¿Olvidaste tu contraseña?
              </Link>
            </Box>

            {/* Login Button */}
            <Button 
              type="submit" 
              variant="contained" 
              fullWidth 
              sx={styles.loginButtonStyles}
            >
              Iniciar Sesión
            </Button>

            {/* Bottom Link */}
            <Typography variant="body2" sx={{ textAlign: 'center', fontWeight: 600, color: '#64748B', mt: 3 }}>
              ¿No tienes cuenta?{' '}
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
    </Box>
  );
};

export default LoginPage;
