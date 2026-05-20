export type AuthAction =
  | 'login'
  | 'register'
  | 'forgot-password'
  | 'reset-password'
  | 'verify-email'
  | 'resend-code';

type ErrorPayload = {
  message?: string | string[];
  detail?: string | string[];
  error?: string;
};

const normalizeMessage = (value?: string | string[]) => {
  if (Array.isArray(value)) return value.join(' ');
  return value?.trim() ?? '';
};

export async function extractAuthError(response: Response) {
  let payload: ErrorPayload | null = null;

  try {
    payload = (await response.json()) as ErrorPayload;
  } catch {
    payload = null;
  }

  const backendMessage =
    normalizeMessage(payload?.message) ||
    normalizeMessage(payload?.detail) ||
    payload?.error ||
    '';

  return {
    status: response.status,
    backendMessage,
    userMessage: mapAuthErrorMessage(response.status, backendMessage),
  };
}

export function mapAuthErrorMessage(status?: number, backendMessage = '') {
  const message = backendMessage.toLowerCase();

  if ([502, 503, 504].includes(status ?? 0)) {
    return 'El servidor de Render se está iniciando. Espera un momento e inténtalo de nuevo.';
  }

  if (status === 400 || status === 401) {
    if (message.includes('password') || message.includes('credencial') || message.includes('invalid')) {
      return 'El correo o la contraseña no coinciden. Verifica tus datos e inténtalo nuevamente.';
    }
    return 'No pudimos validar tus credenciales. Revisa la información ingresada.';
  }

  if (status === 403) {
    if (message.includes('verify') || message.includes('verified') || message.includes('correo')) {
      return 'Tu cuenta aún no ha sido verificada. Revisa tu correo e ingresa el código de validación.';
    }
    return 'No tienes permiso para completar esta acción en este momento.';
  }

  if (status === 404) {
    return 'No encontramos la información solicitada. Verifica los datos e inténtalo otra vez.';
  }

  if (status === 409) {
    return 'Ya existe una cuenta con ese correo electrónico.';
  }

  if (status === 422) {
    return backendMessage || 'Algunos datos no son válidos. Revísalos e inténtalo nuevamente.';
  }

  if (status === 429) {
    return 'Has realizado demasiados intentos. Espera un momento antes de volver a intentarlo.';
  }

  if (status && status >= 500) {
    return 'Ocurrió un problema en el servidor. Intenta nuevamente en unos minutos.';
  }

  return backendMessage || 'No pudimos completar la solicitud. Inténtalo nuevamente.';
}

export function mapAuthNetworkError(action: AuthAction) {
  switch (action) {
    case 'login':
      return 'No pudimos conectarnos con el servidor para iniciar sesión. Verifica tu conexión e inténtalo de nuevo.';
    case 'register':
      return 'No pudimos conectarnos con el servidor para crear tu cuenta. Inténtalo nuevamente en unos minutos.';
    case 'forgot-password':
      return 'No pudimos enviar la solicitud de recuperación. Revisa tu conexión e inténtalo otra vez.';
    case 'reset-password':
      return 'No pudimos restablecer tu contraseña en este momento. Inténtalo nuevamente.';
    case 'verify-email':
      return 'No pudimos verificar el código en este momento. Inténtalo nuevamente.';
    case 'resend-code':
      return 'No pudimos reenviar el código por ahora. Inténtalo nuevamente en unos minutos.';
    default:
      return 'No pudimos conectarnos con el servidor. Inténtalo nuevamente.';
  }
}
