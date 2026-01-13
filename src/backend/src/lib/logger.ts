type LogLevel = 'info' | 'warn' | 'error';

type LogMeta = Record<string, unknown> | undefined;

const normalizeMeta = (meta: LogMeta) => {
  if (!meta) {
    return undefined;
  }

  const normalized: Record<string, unknown> = { ...meta };
  const error = normalized.error;

  if (error instanceof Error) {
    normalized.error = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return normalized;
};

const writeLog = (level: LogLevel, message: string, meta?: LogMeta) => {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(normalizeMeta(meta) ?? {}),
  };

  const output = JSON.stringify(payload);

  if (level === 'error') {
    console.error(output);
  } else if (level === 'warn') {
    console.warn(output);
  } else {
    console.log(output);
  }
};

export const logger = {
  info: (message: string, meta?: LogMeta) => writeLog('info', message, meta),
  warn: (message: string, meta?: LogMeta) => writeLog('warn', message, meta),
  error: (message: string, meta?: LogMeta) => writeLog('error', message, meta),
};

export type RequestLogContext = {
  requestId?: string;
  userId?: number;
  route?: string;
};
