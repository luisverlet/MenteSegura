export async function extractResponseMessage(response: Response) {
  try {
    const payload = await response.json();
    if (typeof payload?.message === 'string') return payload.message;
    if (Array.isArray(payload?.message)) return payload.message.join(' ');
    if (typeof payload?.detail === 'string') return payload.detail;
    if (Array.isArray(payload?.detail)) return payload.detail.join(' ');
    if (typeof payload?.error === 'string') return payload.error;
  } catch {
    return '';
  }

  return '';
}

export async function buildRequestError(response: Response, fallback: string) {
  const message = await extractResponseMessage(response);

  if ([401, 403].includes(response.status)) {
    return 'Tu sesion no es valida o no tienes permisos para consultar esta informacion.';
  }

  if (response.status === 404) {
    return message || 'No encontramos la informacion solicitada.';
  }

  if (response.status === 422) {
    return message || 'Los datos recibidos no son validos para procesar esta solicitud.';
  }

  if ([429].includes(response.status)) {
    return 'Hay demasiadas solicitudes en este momento. Intenta nuevamente en unos minutos.';
  }

  if ([502, 503, 504].includes(response.status)) {
    return 'El servidor de Render se esta iniciando. Espera un momento e intentalo de nuevo.';
  }

  if (response.status >= 500) {
    return message || 'Ocurrio un problema en el servidor. Intenta nuevamente en unos minutos.';
  }

  return message || fallback;
}

export function buildNetworkError(context: string) {
  return `No pudimos cargar ${context}. Verifica tu conexion e intentalo nuevamente.`;
}
