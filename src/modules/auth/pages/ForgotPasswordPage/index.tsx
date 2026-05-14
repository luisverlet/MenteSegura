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
  Link,
  Snackbar,
  Alert
} from '@mui/material';
import { Mail, Key } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import * as styles from './forgot-password.styles';
import { useRouter } from 'next/navigation';

const forgotSchema = z.object({
  email: z.string().min(1, 'El correo electrónico es obligatorio').email('Email inválido'),
  recoveryCode: z.string().optional(),
});

type ForgotForm = z.infer<typeof forgotSchema>;

const ForgotPasswordPage = () => {
  const [step, setStep] = useState(1);
  const router = useRouter();

  const [errorSnackbar, setErrorSnackbar] = useState({ open: false, message: '' });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data: ForgotForm) => {
    if (step === 1) {
      try {
        // Mocking API call for email validation.
        const response = await fetch('/api/proxy/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: data.email }),
        });
        
        if (response.ok) {
          setStep(2);
        } else {
          // Si el correo no existe en la base de datos (Error lógico)
          setErrorSnackbar({ open: true, message: 'El correo ingresado no existe en nuestro sistema o ocurrió un error.' });
        }
      } catch (error) {
        setErrorSnackbar({ open: true, message: 'Error de conexión al enviar la solicitud.' });
      }
    } else {
      console.log('Restoring with code:', data.recoveryCode);
      router.push('/login');
    }
  };

  const handleCloseSnackbar = () => {
    setErrorSnackbar({ ...errorSnackbar, open: false });
  };

  return (
    <Box sx={styles.pageWrapperStyles}>
      <Card sx={styles.forgotCardStyles}>
        {/* Form Side */}
        <Box sx={styles.formPanelStyles}>
          <Typography 
            variant="h5" 
            sx={{ fontWeight: 800, textAlign: 'center', mb: 1, color: '#1E293B' }}
          >
            Recuperar Contraseña
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ textAlign: 'center', color: '#64748B', mb: 4, px: 2 }}
          >
            Ingresa tu correo electronico para restablecer la contraseña
          </Typography>

          <form onSubmit={handleSubmit(onSubmit)}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', mb: 1, display: 'block' }}>
                  Correo Electrónico
                </Typography>
                <TextField 
                  {...register('email')}
                  placeholder="ejemplo@correo.com"
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  disabled={step === 2}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Box sx={styles.iconBoxStyles}><Mail size={20} /></Box>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              {step === 2 && (
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', mb: 1, display: 'block' }}>
                    Código de Correo
                  </Typography>
                  <TextField 
                    {...register('recoveryCode')}
                    placeholder="AKJ443"
                    error={!!errors.recoveryCode}
                    helperText={errors.recoveryCode?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Box sx={styles.iconBoxStyles}><Key size={20} /></Box>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
              )}

              <Button 
                type="submit"
                variant="contained" 
                fullWidth 
                sx={styles.buttonStyles}
              >
                {step === 1 ? 'Recuperar' : 'Restablecer'}
              </Button>

              <Typography variant="body2" sx={{ textAlign: 'center', mt: 2 }}>
                <NextLink href="/login" passHref legacyBehavior>
                  <Link sx={{ color: '#4F8CFF', textDecoration: 'none', fontWeight: 700 }}>
                    Volver al inicio de sesión
                  </Link>
                </NextLink>
              </Typography>
            </Box>
          </form>
        </Box>

        {/* Illustration Side */}
        <Box sx={styles.illustrationPanelStyles}>
          <Image 
            src="/assets/Recovery.svg" 
            alt="Ilustración de Recuperación" 
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

export default ForgotPasswordPage;
