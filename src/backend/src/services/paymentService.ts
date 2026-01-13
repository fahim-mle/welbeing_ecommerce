import { PaymentProvider, PaymentStatus } from '@prisma/client';

export interface PaymentResult {
  provider: PaymentProvider;
  transactionId: string;
  status: PaymentStatus;
}

export const paymentService = {
  async processPayment(amount: number, token: string): Promise<PaymentResult> {
    return {
      provider: 'MOCK',
      transactionId: `mock_${token}_${Date.now()}`,
      status: 'SUCCESS',
    };
  },

  async verifyPayment(transactionId: string): Promise<boolean> {
    return transactionId.startsWith('mock_');
  },
};
