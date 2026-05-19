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
    'fuerte': 'Riesgo Fuerte',
    'moderadamente_severo': 'Riesgo Moderadamente Severo',
    'severo': 'Riesgo Severo'
  };

  const normalized = risk.toLowerCase().trim();
  return mapping[normalized] || risk;
};

export const toTitleCase = (str: string | null | undefined): string => {
  if (!str) return '';
  return str.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
};

const riskPriority: Record<string, number> = {
  'pendiente': 0,
  'sin datos': 0,
  'riesgo bajo': 1,
  'riesgo minimo': 1,
  'riesgo leve': 2,
  'riesgo moderado': 3,
  'riesgo moderado-fuerte': 4,
  'riesgo moderadamente severo': 5,
  'riesgo alto': 6,
  'riesgo fuerte': 6,
  'riesgo severo': 7,
};

export const combineRisks = (...risks: Array<string | null | undefined>) => {
  const formatted = risks
    .map((risk) => formatRisk(risk))
    .filter((risk) => !!risk && risk !== 'Sin datos' && risk !== 'Pendiente');

  if (formatted.length === 0) return 'Sin datos';

  return formatted.reduce((current, candidate) => {
    const currentWeight = riskPriority[current.toLowerCase()] ?? 0;
    const candidateWeight = riskPriority[candidate.toLowerCase()] ?? 0;
    return candidateWeight > currentWeight ? candidate : current;
  });
};
