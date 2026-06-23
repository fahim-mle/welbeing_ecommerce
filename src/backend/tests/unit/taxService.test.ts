import { calculateOrderTax } from '../../src/services/taxService';

describe('calculateOrderTax', () => {
  it('applies 10% GST to Australian shipping addresses', () => {
    const result = calculateOrderTax({
      subtotal: '99.95',
      shippingCountry: 'Australia',
    });

    expect(result.taxAmount.toFixed(2)).toBe('10.00');
    expect(result.totalPrice.toFixed(2)).toBe('109.95');
  });

  it('does not apply GST to non-Australian shipping addresses', () => {
    const result = calculateOrderTax({
      subtotal: '99.95',
      shippingCountry: 'USA',
    });

    expect(result.taxAmount.toFixed(2)).toBe('0.00');
    expect(result.totalPrice.toFixed(2)).toBe('99.95');
  });

  it('recognizes AU country aliases case-insensitively', () => {
    const result = calculateOrderTax({
      subtotal: '12.34',
      shippingCountry: 'au',
    });

    expect(result.taxAmount.toFixed(2)).toBe('1.23');
    expect(result.totalPrice.toFixed(2)).toBe('13.57');
  });
});
