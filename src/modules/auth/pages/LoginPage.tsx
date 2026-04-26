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
  IconButton 
} from '@mui/material';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import * as styles from './login.styles';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  rememberMe: z.boolean().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;

const LoginPage = () => {
  const [showPassword, setShowPassword] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
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
        // You might want to save responseData.access_token to localStorage or a cookie here
        if (responseData.access_token) {
          localStorage.setItem('auth_token', responseData.access_token);
        }
        window.location.href = '/dashboard';
      } else {
        const errorData = await response.json();
        alert(`Error de login: ${JSON.stringify(errorData)}`);
      }
    } catch (error) {
      console.error('Login failed', error);
      alert('Error en el login');
    }
  };

  return (
    <Box sx={styles.pageWrapperStyles}>
      <Card sx={styles.loginCardStyles}>
        {/* Left Side: Illustration */}
        <Box sx={styles.illustrationPanelStyles}>
          <Image 
            src="/assets/login.svg" 
            alt="Login Illustration" 
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
                Email
              </Typography>
              <TextField 
                {...register('email')}
                placeholder="example@gmail.com"
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
                Password
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

            {/* Remember Me & Forgot Password */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
              <FormControlLabel 
                control={<Checkbox {...register('rememberMe')} color="primary" />} 
                label={<Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>Remember me</Typography>} 
              />
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
              Login
            </Button>

            {/* Bottom Link */}
            <Typography variant="body2" sx={{ textAlign: 'center', fontWeight: 600, color: '#64748B', mt: 3 }}>
              No tienes cuenta?{' '}
              <Link component={NextLink} href="/register" sx={{ color: '#4F8CFF', textDecoration: 'none', fontWeight: 800 }}>
                Crea una
              </Link>
            </Typography>
          </form>
        </Box>
      </Card>
    </Box>
  );
};

export default LoginPage;
