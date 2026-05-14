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
import { usePagination } from '@/core/hooks/usePagination';
import { formatRisk, toTitleCase } from '@/core/utils/formatters';
import * as styles from './student-detail.styles';

const StudentDetailPage = ({ studentId }: { studentId?: string }) => {
  const [view, setView] = useState<'detail' | 'history'>('detail');
  const [student, setStudent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { pagination, handlePageChange, handleRowsPerPageChange } = usePagination(10);

  React.useEffect(() => {
    const fetchStudent = async () => {
      const token = localStorage.getItem('auth_token');
      try {
        const [studentsRes, usersRes, evalsRes, programsRes] = await Promise.all([
          fetch('/api/proxy/students', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/proxy/users', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`/api/proxy/students/${studentId}/evaluations`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/proxy/programs', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        
        if (studentsRes.ok && usersRes.ok) {
          const studentsDataRaw = await studentsRes.json();
          const students = Array.isArray(studentsDataRaw) ? studentsDataRaw : (studentsDataRaw.items || []);
          const users = await usersRes.json();
          let evalsData = null;
          let programsMap = new Map();
          
          if (evalsRes.ok) {
            evalsData = await evalsRes.json();
          }
          if (programsRes.ok) {
             const progData = await programsRes.json();
             const progList = Array.isArray(progData) ? progData : (progData.items || []);
             progList.forEach((p: any[]) => programsMap.set(p[0], p[1]));
          }
          
          // Find the specific student array
          const studentArr = students.find((s: any[]) => String(s[0]) === studentId);
          if (studentArr) {
            const userId = studentArr[1];
            const userArr = users.find((u: any[]) => u[0] === userId);
            
            const history = evalsData?.history || [];
            const mappedHistory = history.map((h: any, idx: number) => ({
              id: idx,
              name: toTitleCase(`${userArr ? userArr[1] : ''} ${userArr ? userArr[2] : ''}`),
              risk: formatRisk(h.risk),
              date: new Date(h.date).toLocaleDateString()
            }));

            const evolution = history.slice().reverse().map((h: any) => ({
              name: new Date(h.date).toLocaleDateString(undefined, { month: 'short' }).toUpperCase(),
              value: h.score
            }));

            setStudent({
              id: studentArr[0],
              name: toTitleCase(userArr ? userArr[1] : ''),
              last_name: toTitleCase(userArr ? userArr[2] : ''),
              student_code: studentArr[2],
              program: toTitleCase(programsMap.get(studentArr[4]) || 'Desconocido'),
              email: userArr ? userArr[3] : '',
              contact: 'No disponible',
              phq9: evalsData?.latest_phq9?.score !== undefined && evalsData?.latest_phq9?.score !== null 
                ? `${evalsData.latest_phq9.score}/27` 
                : 'Sin datos',
              gad7: 'Sin datos', 
              risk_level: formatRisk(evalsData?.current_risk),
              history: mappedHistory,
              evolution: evolution.length > 0 ? evolution : []
            });
          } else {
            setStudent(null);
          }
        }
      } catch (error) {
        console.error('Error al obtener estudiante', error);
      } finally {
        setIsLoading(false);
      }
    };
    if (studentId) {
      fetchStudent();
    } else {
      setIsLoading(false);
    }
  }, [studentId]);

  const InfoItem = ({ label, value }: { label: string; value: string }) => (
    <Box>
      <Typography sx={styles.labelStyles}>{label}</Typography>
      <Typography sx={styles.valueStyles}>{value}</Typography>
    </Box>
  );

  const historyColumns = [
    { id: 'name' as any, label: 'Nombre', align: 'left' as const, minWidth: 200 },
    { id: 'risk' as any, label: 'Nivel de riesgo', align: 'center' as const, minWidth: 150 },
    { id: 'date' as any, label: 'Fecha de actividad', align: 'center' as const, minWidth: 180 },
  ];

  return (
    <DashboardLayout 
      title="Detalle del estudiante" 
      subtitle="Gestión individual" 
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
              {isLoading ? (
                <Typography>Cargando información...</Typography>
              ) : !student ? (
                <Typography>Estudiante no encontrado</Typography>
              ) : (
              <>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 6 }}>
                  {/* Left Side: Info */}
                  <Box sx={{ flex: 1 }}>
                    <InfoItem label="Nombre" value={`${student.name || ''} ${student.last_name || ''}`} />
                    <InfoItem label="Programa Académico" value={`Programa ID: ${student.program || 'N/A'}`} />
                    <InfoItem label="Código" value={student.student_code || student.code || 'N/A'} />
                    <InfoItem label="Correo institucional" value={student.email || 'N/A'} />
                    <InfoItem label="Contacto" value={student.contact || 'No disponible'} />
                  </Box>

                  {/* Right Side: Scores & Chart */}
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', gap: 6, mb: 4 }}>
                      <Box>
                        <Typography sx={styles.scoreLabelStyles}>PHQ9</Typography>
                        <Typography sx={styles.scoreValueStyles}>{student.phq9 ?? 'Sin datos'}</Typography>
                      </Box>
                      <Box>
                        <Typography sx={styles.scoreLabelStyles}>GAD7</Typography>
                        <Typography sx={styles.scoreValueStyles}>{student.gad7 ?? 'Sin datos'}</Typography>
                      </Box>
                    </Box>

                    <Box sx={{ mb: 4 }}>
                      <Typography sx={{ fontWeight: 800, fontSize: '15px', mb: 0.5 }}>Riesgo calculado</Typography>
                      <Typography sx={{ fontWeight: 500, color: '#94A3B8', fontSize: '14px' }}>
                        {student.risk_level || 'Pendiente'}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography sx={{ fontWeight: 800, fontSize: '15px', mb: 1 }}>Evolución del riesgo</Typography>
                      <Box sx={styles.areaChartContainerStyles}>
                        {student.evolution && student.evolution.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={student.evolution} margin={{ top: 5, right: 5, left: -35, bottom: 0 }}>
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
                        ) : (
                          <Box sx={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                            <Typography sx={{ color: '#94A3B8', fontWeight: 600 }}>Sin datos</Typography>
                          </Box>
                        )}
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
              </>
              )}
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
                    rows={(student?.history || []).slice(
                      pagination.page * pagination.rowsPerPage,
                      pagination.page * pagination.rowsPerPage + pagination.rowsPerPage
                    )}
                    totalRows={student?.history?.length || 0}
                    page={pagination.page}
                    rowsPerPage={pagination.rowsPerPage}
                    onPageChange={handlePageChange}
                    onRowsPerPageChange={handleRowsPerPageChange}
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
