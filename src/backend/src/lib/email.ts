import { Resend } from 'resend';
import { logger as defaultLogger } from './logger';

type EmailPayload = {
  from: string;
  to: string;
  subject: string;
  html: string;
};

type EmailClient = {
  send: (payload: EmailPayload) => Promise<unknown>;
};

type EmailLogger = Pick<typeof defaultLogger, 'info' | 'error'>;

type EmailServiceOptions = {
  client?: EmailClient;
  from?: string;
  appUrl?: string;
  logger?: EmailLogger;
};

const defaultFrom = process.env.EMAIL_FROM || 'Welbeing Store <noreply@welbeing.local>';
const defaultAppUrl = (process.env.APP_URL || process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');

const escapeHtml = (value: string) => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const previewToken = (token: string) => `${token.slice(0, 8)}...`;

const buildClientFromEnv = (): EmailClient | undefined => {
  if (!process.env.RESEND_API_KEY) {
    return undefined;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  return {
    send: (payload: EmailPayload) => resend.emails.send(payload),
  };
};

export const createEmailService = (options: EmailServiceOptions = {}) => {
  const client = options.client;
  const logger = options.logger ?? defaultLogger;
  const from = options.from ?? defaultFrom;
  const appUrl = (options.appUrl ?? defaultAppUrl).replace(/\/$/, '');

  const sendEmail = async (purpose: string, payload: Omit<EmailPayload, 'from'>, fallbackMeta: Record<string, unknown>) => {
    if (!client) {
      logger.info(`Email fallback: ${purpose}`, fallbackMeta);
      return;
    }

    try {
      await client.send({ from, ...payload });
      logger.info('Email sent', { purpose, email: payload.to });
    } catch (error) {
      logger.error('Email send failed', { purpose, email: payload.to, error });
      throw error;
    }
  };

  return {
    async sendVerificationEmail(email: string, token: string) {
      const link = `${appUrl}/verify-email/${encodeURIComponent(token)}`;
      await sendEmail('verification email', {
        to: email,
        subject: 'Verify your Welbeing account',
        html: `
          <h1>Verify your Welbeing account</h1>
          <p>Thanks for creating an account. Confirm your email address using the link below.</p>
          <p><a href="${link}">Verify email</a></p>
          <p>If the button does not work, copy this URL into your browser:</p>
          <p>${escapeHtml(link)}</p>
        `,
      }, { email, tokenPreview: previewToken(token) });
    },

    async sendPasswordResetEmail(email: string, token: string) {
      const link = `${appUrl}/reset-password/${encodeURIComponent(token)}`;
      await sendEmail('password reset email', {
        to: email,
        subject: 'Reset your Welbeing password',
        html: `
          <h1>Reset your password</h1>
          <p>Use the link below to reset your password. If you did not request this, you can ignore this email.</p>
          <p><a href="${link}">Reset password</a></p>
          <p>${escapeHtml(link)}</p>
        `,
      }, { email, tokenPreview: previewToken(token) });
    },

    async sendOrderConfirmation(email: string, orderId: number) {
      const link = `${appUrl}/orders/${orderId}`;
      await sendEmail('order confirmation', {
        to: email,
        subject: `Welbeing order #${orderId} confirmation`,
        html: `
          <h1>Order confirmed</h1>
          <p>Your order #${orderId} has been received.</p>
          <p><a href="${link}">View order details</a></p>
        `,
      }, { email, orderId });
    },

    async sendOrderStatusUpdate(email: string, orderId: number, status: string) {
      const link = `${appUrl}/orders/${orderId}`;
      await sendEmail('order status update', {
        to: email,
        subject: `Order #${orderId} status update: ${status}`,
        html: `
          <h1>Order status updated</h1>
          <p>Your order #${orderId} status is now <strong>${escapeHtml(status)}</strong>.</p>
          <p><a href="${link}">View order details</a></p>
        `,
      }, { email, orderId, status });
    },
  };
};

export const emailService = createEmailService({ client: buildClientFromEnv() });
