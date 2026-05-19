export type DateRangeValidation = {
  isValid: boolean;
  message?: string;
  field?: 'startDate' | 'endDate';
  startDateKey?: string;
  endDateKey?: string;
};

export type AppointmentSlot = {
  id?: number | string | null;
  appointmentDateIso?: string | null;
};

export type AppointmentScheduleValidation = {
  isValid: boolean;
  message?: string;
  dateError?: string;
  timeError?: string;
};

const DATE_FORMAT_MESSAGE = 'Usa una fecha valida con formato DD/MM/AAAA.';
const TIME_FORMAT_MESSAGE = 'Usa una hora valida con formato HH:mm.';

const pad2 = (value: number) => String(value).padStart(2, '0');

export const dateKeyFromDate = (date: Date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

export const timeKeyFromDate = (date: Date) =>
  `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;

const buildDate = (year: number, month: number, day: number) => {
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
};

export const parseDateInput = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return { date: null, dateKey: '', error: '' };

  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    const date = buildDate(Number(year), Number(month), Number(day));
    return date
      ? { date, dateKey: dateKeyFromDate(date), error: '' }
      : { date: null, dateKey: '', error: DATE_FORMAT_MESSAGE };
  }

  const localMatch = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (localMatch) {
    const [, day, month, year] = localMatch;
    const date = buildDate(Number(year), Number(month), Number(day));
    return date
      ? { date, dateKey: dateKeyFromDate(date), error: '' }
      : { date: null, dateKey: '', error: DATE_FORMAT_MESSAGE };
  }

  return { date: null, dateKey: '', error: DATE_FORMAT_MESSAGE };
};

export const parseTimeInput = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return { timeKey: '', error: '' };

  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  if (!match) return { timeKey: '', error: TIME_FORMAT_MESSAGE };

  const [, hourText, minuteText, meridian] = match;
  let hour = Number(hourText);
  const minute = Number(minuteText);

  if (Number.isNaN(hour) || Number.isNaN(minute) || minute < 0 || minute > 59) {
    return { timeKey: '', error: TIME_FORMAT_MESSAGE };
  }

  if (meridian) {
    if (hour < 1 || hour > 12) return { timeKey: '', error: TIME_FORMAT_MESSAGE };
    const normalizedMeridian = meridian.toUpperCase();
    if (normalizedMeridian === 'PM' && hour < 12) hour += 12;
    if (normalizedMeridian === 'AM' && hour === 12) hour = 0;
  } else if (hour < 0 || hour > 23) {
    return { timeKey: '', error: TIME_FORMAT_MESSAGE };
  }

  return { timeKey: `${pad2(hour)}:${pad2(minute)}`, error: '' };
};

export const normalizeDateKeyFromIso = (value: string | null | undefined) => {
  if (!value) return '';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '' : dateKeyFromDate(parsed);
};

export const normalizeTimeKeyFromIso = (value: string | null | undefined) => {
  if (!value) return '';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '' : timeKeyFromDate(parsed);
};

export const normalizeAppointmentSlot = (value: string | null | undefined) => {
  const dateKey = normalizeDateKeyFromIso(value);
  const timeKey = normalizeTimeKeyFromIso(value);
  return dateKey && timeKey ? `${dateKey} ${timeKey}` : '';
};

export const validateDateRangeInput = (
  startDate: string,
  endDate: string
): DateRangeValidation => {
  const start = parseDateInput(startDate);
  if (start.error) {
    return {
      isValid: false,
      field: 'startDate',
      message: `Fecha de inicio invalida. ${start.error}`,
    };
  }

  const end = parseDateInput(endDate);
  if (end.error) {
    return {
      isValid: false,
      field: 'endDate',
      message: `Fecha de fin invalida. ${end.error}`,
    };
  }

  if (start.date && end.date && start.date > end.date) {
    return {
      isValid: false,
      field: 'endDate',
      message: 'La fecha de inicio no puede ser posterior a la fecha de fin.',
    };
  }

  return {
    isValid: true,
    startDateKey: start.dateKey,
    endDateKey: end.dateKey,
  };
};

export const isAppointmentSlotTaken = (
  dateKey: string,
  timeKey: string,
  appointments: AppointmentSlot[],
  currentAppointmentId?: number | string | null
) => {
  if (!dateKey || !timeKey) return false;
  const requestedSlot = `${dateKey} ${timeKey}`;
  const currentId = currentAppointmentId == null ? '' : String(currentAppointmentId);

  return appointments.some((appointment) => {
    const appointmentId = appointment.id == null ? '' : String(appointment.id);
    if (currentId && appointmentId === currentId) return false;
    return normalizeAppointmentSlot(appointment.appointmentDateIso) === requestedSlot;
  });
};

export const validateAppointmentSchedule = (
  appointmentDate: string,
  appointments: AppointmentSlot[],
  currentAppointmentId?: number | string | null
): AppointmentScheduleValidation => {
  if (!appointmentDate) {
    return {
      isValid: false,
      dateError: 'Selecciona una fecha y una hora para la cita.',
      message: 'Selecciona una fecha y una hora para la cita.',
    };
  }

  const parsed = new Date(appointmentDate);
  if (Number.isNaN(parsed.getTime())) {
    return {
      isValid: false,
      dateError: 'Selecciona una fecha valida para la cita.',
      message: 'Selecciona una fecha valida para la cita.',
    };
  }

  const requestedDateKey = dateKeyFromDate(parsed);
  const requestedTimeKey = timeKeyFromDate(parsed);
  const requestedSlot = `${requestedDateKey} ${requestedTimeKey}`;
  const currentId = currentAppointmentId == null ? '' : String(currentAppointmentId);
  const currentAppointment = currentId
    ? appointments.find((appointment) => String(appointment.id ?? '') === currentId)
    : null;
  const isKeepingCurrentSlot = currentAppointment
    ? normalizeAppointmentSlot(currentAppointment.appointmentDateIso) === requestedSlot
    : false;

  if (!isKeepingCurrentSlot && parsed.getTime() <= Date.now()) {
    return {
      isValid: false,
      dateError: 'La cita debe programarse para una fecha y hora futura.',
      message: 'La cita debe programarse para una fecha y hora futura.',
    };
  }

  if (isAppointmentSlotTaken(requestedDateKey, requestedTimeKey, appointments, currentAppointmentId)) {
    return {
      isValid: false,
      timeError: 'Ya existe una cita programada en esa fecha y hora.',
      message: 'Ya existe una cita programada en esa fecha y hora.',
    };
  }

  return { isValid: true };
};
