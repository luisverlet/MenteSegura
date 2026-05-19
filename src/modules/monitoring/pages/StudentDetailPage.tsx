'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Button,
  IconButton,
  Snackbar,
  Alert,
} from '@mui/material';
import { Monitor, ChevronLeft } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer
} from 'recharts';
import DashboardLayout from '@/core/components/layout/DashboardLayout';
import GenericTable from '@/core/components/Table/GenericTable';
import { usePagination } from '@/core/hooks/usePagination';
import { combineRisks, formatRisk, toTitleCase } from '@/core/utils/formatters';
import * as styles from './student-detail.styles';
import { fetchWithRetry } from '@/core/utils/network';
import { buildNetworkError, buildRequestError } from '@/core/utils/request-feedback';

const InfoItem = ({ label, value }: { label: string; value: string }) => (
  <Box>
    <Typography sx={styles.labelStyles}>{label}</Typography>
    <Typography sx={styles.valueStyles}>{value}</Typography>
  </Box>
);

const StudentDetailPage = ({ studentId }: { studentId?: string }) => {
  const [view, setView] = useState<'detail' | 'history'>('detail');
  const [student, setStudent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'error' | 'warning' }>({
    open: false,
    message: '',
    severity: 'error',
  });
  const { pagination, handlePageChange, handleRowsPerPageChange } = usePagination(10);

  React.useEffect(() => {
    const fetchStudent = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setPageError('No encontramos una sesion activa para consultar el detalle del estudiante.');
        setIsLoading(false);
        return;
      }

      try {
        const [studentsRes, usersRes, evalsRes, programsRes] = await Promise.all([
          fetchWithRetry('/api/proxy/students', { headers: { Authorization: `Bearer ${token}` } }),
          fetchWithRetry('/api/proxy/users', { headers: { Authorization: `Bearer ${token}` } }),
          fetchWithRetry(`/api/proxy/students/${studentId}/evaluations`, { headers: { Authorization: `Bearer ${token}` } }),
          fetchWithRetry('/api/proxy/programs', { headers: { Authorization: `Bearer ${token}` } })
        ]);

        const errors: string[] = [];
        if (!studentsRes.ok) errors.push(await buildRequestError(studentsRes, 'No pudimos cargar la lista de estudiantes.'));
        if (!usersRes.ok) errors.push(await buildRequestError(usersRes, 'No pudimos cargar la informacion de usuarios.'));
        if (!evalsRes.ok) errors.push(await buildRequestError(evalsRes, 'No pudimos cargar el historial del estudiante.'));
        if (!programsRes.ok) errors.push(await buildRequestError(programsRes, 'No pudimos cargar los programas academicos.'));

        if (errors.length > 0) {
          setPageError(errors[0]);
          if (errors.length > 1) {
            setSnackbar({ open: true, message: errors.slice(1).join(' '), severity: 'warning' });
          }
          setStudent(null);
          return;
        }

        const studentsDataRaw = await studentsRes.json();
        const students = Array.isArray(studentsDataRaw) ? studentsDataRaw : (studentsDataRaw.items || []);
        const usersData = await usersRes.json();
        const users = Array.isArray(usersData) ? usersData : (usersData.items || []);
        const evalsData = await evalsRes.json();
        const programsDataRaw = await programsRes.json();
        const programList = Array.isArray(programsDataRaw) ? programsDataRaw : (programsDataRaw.items || []);
        const programsMap = new Map();
        programList.forEach((program: any[]) => programsMap.set(program[0], program[1]));

        const studentArr = students.find((entry: any[]) => String(entry[0]) === studentId);
        if (!studentArr) {
          setPageError('No encontramos el estudiante solicitado.');
          setStudent(null);
          return;
        }

        const userId = studentArr[1];
        const userArr = users.find((user: any[]) => user[0] === userId);
        const history = evalsData?.history || [];

        const mappedHistory = history.map((entry: any, index: number) => ({
          id: index,
          name: toTitleCase(`${userArr ? userArr[1] : ''} ${userArr ? userArr[2] : ''}`.trim()),
          risk: formatRisk(entry.risk),
          date: new Date(entry.date).toLocaleDateString()
        }));

        const evolution = history.slice().reverse().map((entry: any) => ({
          name: new Date(entry.date).toLocaleDateString(undefined, { month: 'short' }).toUpperCase(),
          value: entry.score
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
          gad7: evalsData?.latest_gad7?.score !== undefined && evalsData?.latest_gad7?.score !== null
            ? `${evalsData.latest_gad7.score}/21`
            : 'Sin datos',
          phq_risk: formatRisk(
            evalsData?.latest_phq9?.risk ||
            evalsData?.latest_phq9?.classification ||
            'Sin datos'
          ),
          gad_risk: formatRisk(
            evalsData?.latest_gad7?.risk ||
            evalsData?.latest_gad7?.classification ||
            evalsData?.gad_risk ||
            evalsData?.anxiety_risk ||
            'Sin datos'
          ),
          risk_level: combineRisks(
            evalsData?.latest_phq9?.risk || evalsData?.latest_phq9?.classification,
            evalsData?.latest_gad7?.risk || evalsData?.latest_gad7?.classification || evalsData?.gad_risk || evalsData?.anxiety_risk,
            evalsData?.current_risk
          ),
          history: mappedHistory,
          evolution: evolution.length > 0 ? evolution : []
        });
      } catch (error) {
        console.error('Error al obtener estudiante', error);
        setPageError(buildNetworkError('el detalle del estudiante'));
      } finally {
        setIsLoading(false);
      }
    };

    if (studentId) {
      fetchStudent();
    } else {
      setPageError('No recibimos un identificador valido para consultar el estudiante.');
      setIsLoading(false);
    }
  }, [studentId]);

  const historyColumns = [
    { id: 'name' as any, label: 'Nombre', align: 'left' as const, minWidth: 200 },
    { id: 'risk' as any, label: 'Nivel de riesgo', align: 'center' as const, minWidth: 150 },
    { id: 'date' as any, label: 'Fecha de actividad', align: 'center' as const, minWidth: 180 },
  ];

  return (
    <DashboardLayout title="Detalle del estudiante" subtitle="Gestion individual" Icon={Monitor}>
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 250px)' }}>
        <Card sx={styles.detailCardStyles}>
          {pageError && (
            <Card sx={{ p: 3, borderRadius: '20px', border: '1px solid #FECACA', backgroundColor: '#FFF5F5', boxShadow: 'none', mb: 3 }}>
              <Typography sx={{ fontWeight: 800, color: '#B91C1C', mb: 0.7 }}>
                No pudimos cargar completamente el detalle
              </Typography>
              <Typography sx={{ color: '#7F1D1D', fontWeight: 600, fontSize: '14px' }}>
                {pageError}
              </Typography>
            </Card>
          )}

          {view === 'detail' ? (
            <Box sx={{ width: '100%' }}>
              {isLoading ? (
                <Typography>Cargando informacion...</Typography>
              ) : !student ? (
                <Typography>Estudiante no encontrado</Typography>
              ) : (
                <>
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 6 }}>
                    <Box sx={{ flex: 1 }}>
                      <InfoItem label="Nombre" value={`${student.name || ''} ${student.last_name || ''}`} />
                      <InfoItem label="Programa Academico" value={student.program || 'N/A'} />
                      <InfoItem label="Codigo" value={student.student_code || student.code || 'N/A'} />
                      <InfoItem label="Correo institucional" value={student.email || 'N/A'} />
                      <InfoItem label="Contacto" value={student.contact || 'No disponible'} />
                    </Box>

                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', gap: 6, mb: 4 }}>
                        <Box>
                          <Typography sx={styles.scoreLabelStyles}>PHQ9</Typography>
                          <Typography sx={styles.scoreValueStyles}>{student.phq9 ?? 'Sin datos'}</Typography>
                          <Typography sx={styles.scoreRiskStyles}>{student.phq_risk ?? 'Sin datos'}</Typography>
                        </Box>
                        <Box>
                          <Typography sx={styles.scoreLabelStyles}>GAD7</Typography>
                          <Typography sx={styles.scoreValueStyles}>{student.gad7 ?? 'Sin datos'}</Typography>
                          <Typography sx={styles.scoreRiskStyles}>{student.gad_risk ?? 'Sin datos'}</Typography>
                        </Box>
                      </Box>

                      <Box sx={{ mb: 4 }}>
                        <Typography sx={{ fontWeight: 800, fontSize: '15px', mb: 0.5 }}>Riesgo calculado</Typography>
                        <Typography sx={{ fontWeight: 500, color: '#94A3B8', fontSize: '14px' }}>
                          {student.risk_level || 'Pendiente'}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography sx={{ fontWeight: 800, fontSize: '15px', mb: 1 }}>Evolucion del riesgo</Typography>
                        <Box sx={styles.areaChartContainerStyles}>
                          {student.evolution && student.evolution.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={student.evolution} margin={{ top: 5, right: 5, left: -35, bottom: 0 }}>
                                <defs>
                                  <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#FB923C" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#FB923C" stopOpacity={0} />
                                  </linearGradient>
                                </defs>
                                <Area type="monotone" dataKey="value" stroke="#FB923C" strokeWidth={3} fill="url(#colorVal)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 7, fontWeight: 800, fill: '#CBD5E1' }} />
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
                    <Button onClick={() => setView('history')} sx={styles.historyButtonStyles}>
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

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((current) => ({ ...current, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar((current) => ({ ...current, open: false }))} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </DashboardLayout>
  );
};

export default StudentDetailPage;
