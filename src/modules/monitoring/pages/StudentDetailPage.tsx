'use client';

import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  Button, 
  IconButton
} from '@mui/material';
import { Monitor, ChevronLeft } from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import DashboardLayout from '@/core/components/layout/DashboardLayout';
import GenericTable from '@/core/components/Table/GenericTable';
import * as styles from './student-detail.styles';

const evolutionData = [
  { name: 'ENERO', value: 30 },
  { name: 'FEBRERO', value: 45 },
  { name: 'MARZO', value: 65 },
  { name: 'ABRIL', value: 55 },
  { name: 'MAYO', value: 85 },
  { name: 'JUNIO', value: 35 },
];

const mockHistoryData = [
  { id: 1, name: 'Luis Alejandro Vergel', risk: '32%', date: '02 - 03 - 2026' },
  { id: 2, name: 'Luis Alejandro Vergel', risk: '32%', date: '02 - 03 - 2026' },
  { id: 3, name: 'Luis Alejandro Vergel', risk: '32%', date: '02 - 03 - 2026' },
  { id: 4, name: 'Luis Alejandro Vergel', risk: '32%', date: '02 - 03 - 2026' },
];

const StudentDetailPage = () => {
  const [view, setView] = useState<'detail' | 'history'>('detail');

  const InfoItem = ({ label, value }: { label: string; value: string }) => (
    <Box>
      <Typography sx={styles.labelStyles}>{label}</Typography>
      <Typography sx={styles.valueStyles}>{value}</Typography>
    </Box>
  );

  const historyColumns = [
    { id: 'name' as const, label: 'Nombre', align: 'left' as const, minWidth: 200 },
    { id: 'risk' as const, label: 'Nivel de riesgo', align: 'center' as const, minWidth: 150 },
    { id: 'date' as const, label: 'Fecha de actividad', align: 'center' as const, minWidth: 180 },
  ];

  return (
    <DashboardLayout 
      title="Detalle estudiante" 
      subtitle="Gestion individual" 
      Icon={Monitor}
    >
      <Box sx={{ 
        flex: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        minHeight: 'calc(100vh - 250px)'
      }}>
        <Card sx={styles.detailCardStyles}>
          {view === 'detail' ? (
            <Box sx={{ width: '100%' }}>
              {/* Two-column layout using flexbox to avoid MUI Grid negative margin issue */}
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 6 }}>
                {/* Left Side: Info */}
                <Box sx={{ flex: 1 }}>
                  <InfoItem label="Nombre" value="Luis Alejandro Vergel" />
                  <InfoItem label="Programa Academico" value="Ingenieria de Sistemas" />
                  <InfoItem label="Codigo" value="02220131053" />
                  <InfoItem label="Correo institucional" value="02220131053@mail.udes.edu.co" />
                  <InfoItem label="Contacto" value="No disponible" />
                </Box>

                {/* Right Side: Scores & Chart */}
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', gap: 6, mb: 4 }}>
                    <Box>
                      <Typography sx={styles.scoreLabelStyles}>PHQ9</Typography>
                      <Typography sx={styles.scoreValueStyles}>0-27</Typography>
                    </Box>
                    <Box>
                      <Typography sx={styles.scoreLabelStyles}>GAD7</Typography>
                      <Typography sx={styles.scoreValueStyles}>0-21</Typography>
                    </Box>
                  </Box>

                  <Box sx={{ mb: 4 }}>
                    <Typography sx={{ fontWeight: 800, fontSize: '15px', mb: 0.5 }}>Riesgo calculado</Typography>
                    <Typography sx={{ fontWeight: 500, color: '#94A3B8', fontSize: '14px' }}>0%</Typography>
                  </Box>

                  <Box>
                    <Typography sx={{ fontWeight: 800, fontSize: '15px', mb: 1 }}>Evolucion riesgo</Typography>
                    <Box sx={styles.areaChartContainerStyles}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={evolutionData} margin={{ top: 5, right: 5, left: -35, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#FB923C" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#FB923C" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <Area 
                            type="monotone" 
                            dataKey="value" 
                            stroke="#FB923C" 
                            strokeWidth={3}
                            fill="url(#colorVal)" 
                          />
                          <XAxis 
                            dataKey="name" 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 7, fontWeight: 800, fill: '#CBD5E1' }}
                          />
                          <YAxis axisLine={false} tickLine={false} hide />
                        </AreaChart>
                      </ResponsiveContainer>
                    </Box>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
                <Button 
                  onClick={() => setView('history')}
                  sx={styles.historyButtonStyles}
                >
                  Ver Historial
                </Button>
              </Box>
            </Box>
          ) : (
            <Box sx={{ width: '100%', minHeight: 450, display: 'flex', flexDirection: 'column' }}>
               <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, gap: 2 }}>
                  <IconButton onClick={() => setView('detail')} sx={{ backgroundColor: '#F8FAFC' }}>
                    <ChevronLeft size={20} />
                  </IconButton>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>Historial de actividad</Typography>
               </Box>

               <Box sx={{ flex: 1, backgroundColor: '#FFF', borderRadius: '16px', overflow: 'hidden' }}>
                  <GenericTable 
                    columns={historyColumns} 
                    rows={mockHistoryData}
                    totalRows={mockHistoryData.length}
                    page={0}
                    rowsPerPage={10}
                    onPageChange={() => {}}
                    onRowsPerPageChange={() => {}}
                  />
               </Box>
            </Box>
          )}
        </Card>
      </Box>
    </DashboardLayout>
  );
};

export default StudentDetailPage;
