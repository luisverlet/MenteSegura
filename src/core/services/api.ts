import { Student, ExportOptions, FilterState } from '@/core/types';

// ===========================================================
// API CLIENT – swap BASE_URL when backend is ready
// ===========================================================
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

// Generic fetch helper (extendable with auth headers)
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

// ===========================================================
// MONITORING SERVICE
// ===========================================================
export const monitoringService = {
  /** List all students with optional filters */
  getStudents: (filters?: Partial<FilterState>) =>
    apiFetch<Student[]>('/api/monitoring/students', {
      method: 'POST',
      body: JSON.stringify(filters ?? {}),
    }),

  /** Get a single student's full profile */
  getStudentById: (id: number) =>
    apiFetch<Student>(`/api/monitoring/students/${id}`),

  /** Get risk evolution data points for a student */
  getStudentRiskEvolution: (id: number) =>
    apiFetch<{ name: string; value: number }[]>(
      `/api/monitoring/students/${id}/evolution`
    ),
};

// ===========================================================
// REPORTS SERVICE
// ===========================================================
export const reportsService = {
  /** Get all report rows */
  getReports: (filters?: Partial<FilterState>) =>
    apiFetch<Student[]>('/api/reports', {
      method: 'POST',
      body: JSON.stringify(filters ?? {}),
    }),

  /** Trigger a server-side export and return a download URL */
  exportReport: (options: ExportOptions) =>
    apiFetch<{ downloadUrl: string }>('/api/reports/export', {
      method: 'POST',
      body: JSON.stringify(options),
    }),
};
