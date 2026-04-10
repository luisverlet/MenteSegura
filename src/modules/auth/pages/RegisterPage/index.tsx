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
  Link
} from '@mui/material';
import { User, Key, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import * as styles from './register.styles';
import { useRouter } from 'next/navigation';

const registerSchema = z.object({
  firstName: z.string().min(2, 'El nombre es obligatorio'),
  lastName: z.string().min(2, 'Los apellidos son obligatorios'),
  usageKey: z.string().min(3, 'La llave de uso es requerida'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  confirmPassword: z.string().min(6, 'Mínimo 6 caracteres'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

const RegisterPage = () => {
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange'
  });

  const handleNext = async () => {
    const isStepValid = await trigger(['firstName', 'lastName', 'usageKey']);
    if (isStepValid) setStep(2);
  };

  const onSubmit = (data: RegisterForm) => {
    console.log('Register data:', data);
    router.push('/verify-email');
  };

  return (
    <Box sx={styles.pageWrapperStyles}>
      <Card sx={styles.registerCardStyles}>
        {/* Form Side */}
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
                    placeholder="Luis Alejandro"
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
                    placeholder="Vergel Irlet"
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
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', mb: 1, display: 'block' }}>
                    Llave de Uso
                  </Typography>
                  <TextField 
                    {...register('usageKey')}
                    placeholder="AKJ443"
                    error={!!errors.usageKey}
                    helperText={errors.usageKey?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Box sx={styles.iconBoxStyles}><Key size={20} /></Box>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
                <Button 
                  variant="contained" 
                  fullWidth 
                  onClick={handleNext}
                  sx={{ ...styles.buttonStyles, backgroundColor: '#4F8CFF', mt: 2 }}
                >
                  Siguiente
                </Button>
              </Box>
            )}

            {step === 2 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box>
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
                          <Box sx={styles.iconBoxStyles}><Mail size={20} /></Box>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
                <Box>
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
                          <Box sx={styles.iconBoxStyles}><Lock size={20} /></Box>
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword(!showPassword)}><Eye size={20} /></IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', mb: 1, display: 'block' }}>
                    Repetir Contraseña
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
                  <Button 
                    variant="contained" 
                    fullWidth 
                    onClick={() => setStep(1)}
                    sx={{ ...styles.buttonStyles, backgroundColor: '#4F8CFF', opacity: 0.8 }}
                  >
                    Anterior
                  </Button>
                  <Button 
                    type="submit"
                    variant="contained" 
                    fullWidth 
                    sx={{ ...styles.buttonStyles, backgroundColor: '#4F8CFF' }}
                  >
                    Registrar
                  </Button>
                </Box>
              </Box>
            )}

            <Typography variant="body2" sx={{ textAlign: 'center', mt: 4, fontWeight: 600, color: '#64748B' }}>
              ¿Ya tienes cuenta?{' '}
              <NextLink href="/login" passHref legacyBehavior>
                <Link sx={{ color: '#4F8CFF', textDecoration: 'none', fontWeight: 800 }}>
                  Inicia sesión
                </Link>
              </NextLink>
            </Typography>
          </form>
        </Box>

        {/* Illustration Side */}
        <Box sx={styles.illustrationPanelStyles}>
          <Image 
            src="/assets/creation.svg" 
            alt="Registration Illustration" 
            width={550} 
            height={550} 
            priority 
          />
        </Box>
      </Card>
    </Box>
  );
};

export default RegisterPage;
