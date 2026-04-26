export const formatRisk = (risk: string | null | undefined): string => {
  if (!risk || risk === 'Pendiente') return 'Pendiente';
  
  const mapping: Record<string, string> = {
    'riesgo_bajo': 'Riesgo Bajo',
    'riesgo_medio': 'Riesgo Medio',
    'riesgo_alto': 'Riesgo Alto',
    'bajo': 'Riesgo Bajo',
    'medio': 'Riesgo Medio',
    'alto': 'Riesgo Alto',
    'minimo': 'Riesgo Mínimo',
    'leve': 'Riesgo Leve',
    'moderado': 'Riesgo Moderado',
    'moderado_fuerte': 'Riesgo Moderado-Fuerte',
    'fuerte': 'Riesgo Fuerte'
  };

  const normalized = risk.toLowerCase().trim();
  return mapping[normalized] || risk;
};

export const toTitleCase = (str: string | null | undefined): string => {
  if (!str) return '';
  return str.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
};
