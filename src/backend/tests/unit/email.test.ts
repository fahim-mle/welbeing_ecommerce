import { createEmailService } from '../../src/lib/email';

describe('email service', () => {
  it('falls back to logger when no Resend client is configured', async () => {
    const logger = { info: jest.fn(), error: jest.fn() };
    const service = createEmailService({ logger });

    await service.sendVerificationEmail('customer@example.com', 'verify-token');

    expect(logger.info).toHaveBeenCalledWith('Email fallback: verification email', {
      email: 'customer@example.com',
      tokenPreview: 'verify-t...',
    });
  });

  it('sends verification email through configured email client', async () => {
    const send = jest.fn().mockResolvedValue({ data: { id: 'email_123' } });
    const service = createEmailService({
      client: { send },
      from: 'Store <noreply@example.com>',
      appUrl: 'https://store.example.com',
      logger: { info: jest.fn(), error: jest.fn() },
    });

    await service.sendVerificationEmail('customer@example.com', 'verify-token');

    expect(send).toHaveBeenCalledWith(expect.objectContaining({
      from: 'Store <noreply@example.com>',
      to: 'customer@example.com',
      subject: 'Verify your Welbeing account',
      html: expect.stringContaining('https://store.example.com/verify-email/verify-token'),
    }));
  });

  it('sends order status updates through configured email client', async () => {
    const send = jest.fn().mockResolvedValue({ data: { id: 'email_456' } });
    const service = createEmailService({
      client: { send },
      from: 'Store <noreply@example.com>',
      appUrl: 'https://store.example.com',
      logger: { info: jest.fn(), error: jest.fn() },
    });

    await service.sendOrderStatusUpdate('customer@example.com', 42, 'SHIPPED');

    expect(send).toHaveBeenCalledWith(expect.objectContaining({
      to: 'customer@example.com',
      subject: 'Order #42 status update: SHIPPED',
      html: expect.stringContaining('SHIPPED'),
    }));
  });
});
