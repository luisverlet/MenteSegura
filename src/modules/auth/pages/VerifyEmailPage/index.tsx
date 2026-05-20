'use client';

import React, { useState, useRef } from 'react';
import { Box, Typography, Button, Link, Snackbar, Alert } from '@mui/material';
import * as styles from './verify-email.styles';
import { useRouter, useSearchParams } from 'next/navigation';
import { extractAuthError, mapAuthNetworkError } from '@/modules/auth/utils/auth-feedback';

const VerifyEmailPage = () => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [successSnackbar, setSuccessSnackbar] = useState({ open: false, message: '' });
  const [errorSnackbar, setErrorSnackbar] = useState({ open: false, message: '' });
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const handleChange = (index: number, value: string) => {
    let nextValue = value;
    if (nextValue.length > 1) nextValue = nextValue.slice(-1);
    if (!/^\d*$/.test(nextValue)) return;

    const newCode = [...code];
    newCode[index] = nextValue;
    setCode(newCode);

    if (nextValue && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    try {
      const response = await fetch('/api/proxy/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          verification_code: code.join(''),
        }),
      });

      if (response.ok) {
        setSuccessSnackbar({ open: true, message: 'Correo verificado con éxito. Ahora puedes iniciar sesión.' });
        router.push('/login');
        return;
      }

      const { userMessage } = await extractAuthError(response);
      setErrorSnackbar({ open: true, message: userMessage });
    } catch (error) {
      console.error('Verification failed', error);
      setErrorSnackbar({ open: true, message: mapAuthNetworkError('verify-email') });
    }
  };

  const handleResend = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      const response = await fetch('/api/proxy/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setSuccessSnackbar({ open: true, message: 'Hemos reenviado el código a tu correo.' });
        return;
      }

      const { userMessage } = await extractAuthError(response);
      setErrorSnackbar({ open: true, message: userMessage });
    } catch (error) {
      console.error('Resend failed', error);
      setErrorSnackbar({ open: true, message: mapAuthNetworkError('resend-code') });
    }
  };

  return (
    <Box sx={styles.pageWrapperStyles}>
      <Box sx={styles.verifyCardStyles}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
          Verificar correo electrónico
        </Typography>
        <Typography variant="body1" sx={{ color: '#64748B', mb: 4 }}>
          Ingresa el código enviado a tu correo
        </Typography>

        <Box sx={styles.codeInputContainerStyles}>
          {code.map((digit, index) => (
            <Box key={index} sx={styles.codeBoxStyles}>
              <input
                ref={(el) => {
                  inputs.current[index] = el;
                }}
                type="text"
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                style={{
                  width: '100%',
                  height: '100%',
                  background: 'none',
                  border: 'none',
                  outline: 'none',
                  textAlign: 'center',
                  fontSize: 'inherit',
                  fontWeight: 'inherit',
                  fontFamily: 'inherit',
                }}
              />
            </Box>
          ))}
        </Box>

        <Button variant="contained" sx={styles.verifyButtonStyles} onClick={handleVerify} disabled={code.some((digit) => !digit)}>
          Verificar código
        </Button>

        <Box sx={{ mt: 4 }}>
          <Typography variant="body2" sx={{ color: '#94A3B8' }}>
            Espera <span style={{ fontWeight: 700, color: '#1E293B' }}>30</span> segundos antes de reenviar
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, fontWeight: 700 }}>
            ¿No llegó el código? <Link href="#" onClick={handleResend} sx={{ color: '#4F8CFF', textDecoration: 'none' }}>Reenviar</Link>
          </Typography>
        </Box>
      </Box>

      <Snackbar
        open={successSnackbar.open}
        autoHideDuration={5000}
        onClose={() => setSuccessSnackbar((current) => ({ ...current, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccessSnackbar((current) => ({ ...current, open: false }))} severity="success" sx={{ width: '100%' }}>
          {successSnackbar.message}
        </Alert>
      </Snackbar>

      <Snackbar
        open={errorSnackbar.open}
        autoHideDuration={6000}
        onClose={() => setErrorSnackbar((current) => ({ ...current, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setErrorSnackbar((current) => ({ ...current, open: false }))} severity="error" sx={{ width: '100%' }}>
          {errorSnackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default VerifyEmailPage;
