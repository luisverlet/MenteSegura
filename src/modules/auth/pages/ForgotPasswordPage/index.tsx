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
  Alert,
} from '@mui/material';
import { Mail, Key, Lock } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import * as styles from './forgot-password.styles';
import { useRouter } from 'next/navigation';
import { extractAuthError, mapAuthNetworkError } from '@/modules/auth/utils/auth-feedback';

const forgotSchema = z.object({
  email: z.string().min(1, 'El correo electrónico es obligatorio').email('Correo electrónico inválido'),
  recoveryCode: z.string().optional(),
  newPassword: z.string().optional(),
  confirmPassword: z.string().optional(),
});

type ForgotForm = z.infer<typeof forgotSchema>;

const ForgotPasswordPage = () => {
  const [step, setStep] = useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorSnackbar, setErrorSnackbar] = useState({ open: false, message: '' });
  const [successSnackbar, setSuccessSnackbar] = useState({ open: false, message: '' });
  const router = useRouter();

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
    defaultValues: {
      email: '',
      recoveryCode: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: ForgotForm) => {
    setIsSubmitting(true);

    try {
      if (step === 1) {
        const response = await fetch('/api/proxy/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: data.email }),
        });

        if (response.ok) {
          setStep(2);
          setSuccessSnackbar({ open: true, message: 'Enviamos un código de recuperación a tu correo.' });
          return;
        }

        const { userMessage } = await extractAuthError(response);
        setErrorSnackbar({ open: true, message: userMessage });
        return;
      }

      if (!data.recoveryCode?.trim()) {
        setErrorSnackbar({ open: true, message: 'Ingresa el código de recuperación.' });
        return;
      }

      if (!data.newPassword || data.newPassword.length < 6) {
        setErrorSnackbar({ open: true, message: 'La nueva contraseña debe tener al menos 6 caracteres.' });
        return;
      }

      if (data.newPassword !== data.confirmPassword) {
        setErrorSnackbar({ open: true, message: 'La confirmación de la nueva contraseña no coincide.' });
        return;
      }

      const response = await fetch('/api/proxy/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          reset_code: data.recoveryCode,
          new_password: data.newPassword,
        }),
      });

      if (response.ok) {
        setSuccessSnackbar({ open: true, message: 'Tu contraseña fue restablecida correctamente.' });
        setTimeout(() => {
          router.push('/login');
        }, 1200);
        return;
      }

      const { userMessage } = await extractAuthError(response);
      setErrorSnackbar({ open: true, message: userMessage });
    } catch (error) {
      console.error('Forgot/reset password failed', error);
      setErrorSnackbar({
        open: true,
        message: step === 1 ? mapAuthNetworkError('forgot-password') : mapAuthNetworkError('reset-password'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    const email = getValues('email');
    if (!email) {
      setErrorSnackbar({ open: true, message: 'Ingresa tu correo antes de reenviar el código.' });
      return;
    }

    setIsResending(true);
    try {
      const response = await fetch('/api/proxy/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setSuccessSnackbar({ open: true, message: 'Reenviamos el código a tu correo.' });
        return;
      }

      const { userMessage } = await extractAuthError(response);
      setErrorSnackbar({ open: true, message: userMessage });
    } catch (error) {
      console.error('Resend code failed', error);
      setErrorSnackbar({ open: true, message: mapAuthNetworkError('resend-code') });
    } finally {
      setIsResending(false);
    }
  };

  const handleCloseErrorSnackbar = () => {
    setErrorSnackbar((current) => ({ ...current, open: false }));
  };

  const handleCloseSuccessSnackbar = () => {
    setSuccessSnackbar((current) => ({ ...current, open: false }));
  };

  return (
    <Box sx={styles.pageWrapperStyles}>
      <Card sx={styles.forgotCardStyles}>
        <Box sx={styles.formPanelStyles}>
          <Typography variant="h5" sx={{ fontWeight: 800, textAlign: 'center', mb: 1, color: '#1E293B' }}>
            Recuperar contraseña
          </Typography>
          <Typography variant="body2" sx={{ textAlign: 'center', color: '#64748B', mb: 4, px: 2 }}>
            {step === 1
              ? 'Ingresa tu correo electrónico para recibir un código de recuperación.'
              : 'Ingresa el código recibido y define tu nueva contraseña.'}
          </Typography>

          <form onSubmit={handleSubmit(onSubmit)}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', mb: 1, display: 'block' }}>
                  Correo electrónico
                </Typography>
                <TextField
                  {...register('email')}
                  placeholder="ejemplo@correo.com"
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  disabled={step === 2 || isSubmitting}
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
                <>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', mb: 1, display: 'block' }}>
                      Código de recuperación
                    </Typography>
                    <TextField
                      {...register('recoveryCode')}
                      placeholder="AKJ443"
                      error={!!errors.recoveryCode}
                      helperText={errors.recoveryCode?.message}
                      disabled={isSubmitting}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Box sx={styles.iconBoxStyles}><Key size={20} /></Box>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Box>

                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', mb: 1, display: 'block' }}>
                      Nueva contraseña
                    </Typography>
                    <TextField
                      {...register('newPassword')}
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      error={!!errors.newPassword}
                      helperText={errors.newPassword?.message}
                      disabled={isSubmitting}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Box sx={styles.iconBoxStyles}><Lock size={20} /></Box>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Box>

                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', mb: 1, display: 'block' }}>
                      Confirmar nueva contraseña
                    </Typography>
                    <TextField
                      {...register('confirmPassword')}
                      type="password"
                      placeholder="Repite tu nueva contraseña"
                      error={!!errors.confirmPassword}
                      helperText={errors.confirmPassword?.message}
                      disabled={isSubmitting}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Box sx={styles.iconBoxStyles}><Lock size={20} /></Box>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Box>

                  <Button
                    type="button"
                    variant="outlined"
                    fullWidth
                    disabled={isResending || isSubmitting}
                    onClick={handleResendCode}
                    sx={{
                      height: 52,
                      borderRadius: '12px',
                      fontSize: '15px',
                      fontWeight: 700,
                      textTransform: 'none',
                      borderColor: '#D6E4FF',
                      color: '#4F8CFF',
                    }}
                  >
                    {isResending ? 'Reenviando...' : 'Reenviar código'}
                  </Button>
                </>
              )}

              <Button type="submit" variant="contained" fullWidth disabled={isSubmitting} sx={styles.buttonStyles}>
                {isSubmitting ? 'Procesando...' : step === 1 ? 'Enviar código' : 'Restablecer contraseña'}
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

        <Box sx={styles.illustrationPanelStyles}>
          <Image
            src="/assets/Recovery.svg"
            alt="Ilustración de recuperación"
            width={550}
            height={550}
            priority
          />
        </Box>
      </Card>

      <Snackbar open={errorSnackbar.open} autoHideDuration={6000} onClose={handleCloseErrorSnackbar} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert onClose={handleCloseErrorSnackbar} severity="error" sx={{ width: '100%' }}>
          {errorSnackbar.message}
        </Alert>
      </Snackbar>

      <Snackbar open={successSnackbar.open} autoHideDuration={5000} onClose={handleCloseSuccessSnackbar} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert onClose={handleCloseSuccessSnackbar} severity="success" sx={{ width: '100%' }}>
          {successSnackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ForgotPasswordPage;
