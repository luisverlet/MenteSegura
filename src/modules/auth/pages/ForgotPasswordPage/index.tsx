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
  Link 
} from '@mui/material';
import { Mail, Key } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import * as styles from './forgot-password.styles';
import { useRouter } from 'next/navigation';

const forgotSchema = z.object({
  email: z.string().email('Email inválido'),
  recoveryCode: z.string().optional(),
});

type ForgotForm = z.infer<typeof forgotSchema>;

const ForgotPasswordPage = () => {
  const [step, setStep] = useState(1);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = (data: ForgotForm) => {
    if (step === 1) {
      console.log('Requesting recovery for:', data.email);
      setStep(2);
    } else {
      console.log('Restoring with code:', data.recoveryCode);
      router.push('/login');
    }
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
                  Email
                </Typography>
                <TextField 
                  {...register('email')}
                  placeholder="example@gmail.com"
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
                    Codigo de Email
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
                    Volver al Login
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
            alt="Recovery Illustration" 
            width={550} 
            height={550} 
            priority 
          />
        </Box>
      </Card>
    </Box>
  );
};

export default ForgotPasswordPage;
