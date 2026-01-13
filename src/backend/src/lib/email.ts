import { logger } from './logger';

export const emailService = {
  async sendVerificationEmail(email: string, token: string) {
    logger.info('Send verification email', { email, token });
  },
  async sendPasswordResetEmail(email: string, token: string) {
    logger.info('Send password reset email', { email, token });
  },
};
