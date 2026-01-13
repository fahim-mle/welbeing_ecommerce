import { logger } from './logger';

export const emailService = {
  async sendVerificationEmail(email: string, token: string) {
    logger.info('Send verification email', { email, token });
  },
  async sendPasswordResetEmail(email: string, token: string) {
    logger.info('Send password reset email', { email, token });
  },
  async sendOrderConfirmation(email: string, orderId: number) {
    logger.info('Send order confirmation', { email, orderId });
  },
  async sendOrderStatusUpdate(email: string, orderId: number, status: string) {
    logger.info('Send order status update', { email, orderId, status });
  },
};
