const GST_RATE = 0.1;
const AU_COUNTRY_ALIASES = new Set(['AU', 'AUS', 'AUSTRALIA']);

const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export const isAustralianShippingCountry = (country?: string | null) => {
  if (!country) return false;
  return AU_COUNTRY_ALIASES.has(country.trim().toUpperCase());
};

export const calculateCheckoutTotals = (subtotal: number, shippingCountry?: string | null) => {
  const roundedSubtotal = roundMoney(subtotal);
  const appliesGst = isAustralianShippingCountry(shippingCountry);
  const taxAmount = appliesGst ? roundMoney(roundedSubtotal * GST_RATE) : 0;

  return {
    subtotal: roundedSubtotal,
    taxAmount,
    total: roundMoney(roundedSubtotal + taxAmount),
    appliesGst,
  };
};
