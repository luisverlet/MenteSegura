'use client';

import React, { useState, useRef } from 'react';
import { Box, Typography, Button, TextField, Link } from '@mui/material';
import * as styles from './verify-email.styles';
import { useRouter, useSearchParams } from 'next/navigation';

const VerifyEmailPage = () => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
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
          email: email,
          verification_code: code.join('')
        }),
      });
      if (response.ok) {
        alert('Email verificado con éxito');
        router.push('/login');
      } else {
        const errorData = await response.json();
        alert(`Error: ${JSON.stringify(errorData)}`);
      }
    } catch (error) {
      console.error('Verification failed', error);
      alert('Error al verificar código');
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
        alert('Código reenviado a tu correo');
      } else {
        const errorData = await response.json();
        alert(`Error al reenviar: ${JSON.stringify(errorData)}`);
      }
    } catch (error) {
      console.error('Resend failed', error);
    }
  };

  return (
    <Box sx={styles.pageWrapperStyles}>
      <Box sx={styles.verifyCardStyles}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
          Verificar correo electrónico
        </Typography>
        <Typography variant="body1" sx={{ color: '#64748B', mb: 4 }}>
          Ingresa el codigo enviado a tu correo
        </Typography>

        <Box sx={styles.codeInputContainerStyles}>
          {code.map((digit, index) => (
            <Box key={index} sx={styles.codeBoxStyles}>
              <input
                ref={(el) => (inputs.current[index] = el)}
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
                  fontFamily: 'inherit'
                }}
              />
            </Box>
          ))}
        </Box>

        <Button 
          variant="contained" 
          sx={styles.verifyButtonStyles} 
          onClick={handleVerify}
          disabled={code.some(d => !d)}
        >
          Verificar codigo
        </Button>

        <Box sx={{ mt: 4 }}>
          <Typography variant="body2" sx={{ color: '#94A3B8' }}>
            Espera <span style={{ fontWeight: 700, color: '#1E293B' }}>30</span> segundos antes de reenviar
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, fontWeight: 700 }}>
            No llegó el codigo? <Link href="#" onClick={handleResend} sx={{ color: '#4F8CFF', textDecoration: 'none' }}>Reenviar</Link>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default VerifyEmailPage;
