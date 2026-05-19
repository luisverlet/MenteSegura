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
    return 'El servidor de Render se esta iniciando. Espera un momento e intentalo de nuevo.';
  }

  if (status === 400 || status === 401) {
    if (message.includes('password') || message.includes('credencial') || message.includes('invalid')) {
      return 'El correo o la contrasena no coinciden. Verifica tus datos e intentalo nuevamente.';
    }
    return 'No pudimos validar tus credenciales. Revisa la informacion ingresada.';
  }

  if (status === 403) {
    if (message.includes('verify') || message.includes('verified') || message.includes('correo')) {
      return 'Tu cuenta aun no ha sido verificada. Revisa tu correo e ingresa el codigo de validacion.';
    }
    return 'No tienes permiso para completar esta accion en este momento.';
  }

  if (status === 404) {
    return 'No encontramos la informacion solicitada. Verifica los datos e intentalo otra vez.';
  }

  if (status === 409) {
    return 'Ya existe una cuenta con ese correo electronico.';
  }

  if (status === 422) {
    return backendMessage || 'Algunos datos no son validos. Revisalos e intentalo nuevamente.';
  }

  if (status === 429) {
    return 'Has realizado demasiados intentos. Espera un momento antes de volver a intentarlo.';
  }

  if (status && status >= 500) {
    return 'Ocurrio un problema en el servidor. Intenta nuevamente en unos minutos.';
  }

  return backendMessage || 'No pudimos completar la solicitud. Intentalo nuevamente.';
}

export function mapAuthNetworkError(action: AuthAction) {
  switch (action) {
    case 'login':
      return 'No pudimos conectarnos con el servidor para iniciar sesion. Verifica tu conexion e intentalo de nuevo.';
    case 'register':
      return 'No pudimos conectarnos con el servidor para crear tu cuenta. Intentalo nuevamente en unos minutos.';
    case 'forgot-password':
      return 'No pudimos enviar la solicitud de recuperacion. Revisa tu conexion e intentalo otra vez.';
    case 'reset-password':
      return 'No pudimos restablecer tu contrasena en este momento. Intentalo nuevamente.';
    case 'verify-email':
      return 'No pudimos verificar el codigo en este momento. Intentalo nuevamente.';
    case 'resend-code':
      return 'No pudimos reenviar el codigo por ahora. Intentalo nuevamente en unos minutos.';
    default:
      return 'No pudimos conectarnos con el servidor. Intentalo nuevamente.';
  }
}
