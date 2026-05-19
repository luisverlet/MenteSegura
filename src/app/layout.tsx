import type { Metadata } from 'next';
import ThemeRegistry from './registry';
import { Box } from '@mui/material';

export const metadata: Metadata = {
  title: 'MenteSegura',
  description: 'Sistema Integral de Gestión Educativa',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <ThemeRegistry>
          <Box sx={{ position: 'relative', minHeight: '100vh', overflowX: 'hidden' }}>
            {/* Global Background Image */}
            <Box
              sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: 'url(/assets/Fondo.svg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                opacity: 1.0,
                zIndex: -1,
                pointerEvents: 'none',
              }}
            />
            {children}
          </Box>
        </ThemeRegistry>
      </body>
    </html>
  );
}
