import { calculateCheckoutTotals } from '../utils/tax';

describe('calculateCheckoutTotals', () => {
  it('adds 10% GST for Australian shipping countries', () => {
    expect(calculateCheckoutTotals(99.95, 'Australia')).toEqual({
      subtotal: 99.95,
      taxAmount: 10,
      total: 109.95,
      appliesGst: true,
    });
  });

  it('does not add GST outside Australia', () => {
    expect(calculateCheckoutTotals(99.95, 'USA')).toEqual({
      subtotal: 99.95,
      taxAmount: 0,
      total: 99.95,
      appliesGst: false,
    });
  });
});
