import { Prisma } from '@prisma/client';

const GST_RATE = new Prisma.Decimal('0.10');
const AU_COUNTRY_ALIASES = new Set(['AU', 'AUS', 'AUSTRALIA']);

type CalculateOrderTaxInput = {
  subtotal: Prisma.Decimal.Value;
  shippingCountry?: string | null;
  shippingFee?: Prisma.Decimal.Value;
};

const money = (value: Prisma.Decimal.Value) => new Prisma.Decimal(value).toDecimalPlaces(2);

export const isAustralianShippingCountry = (country?: string | null) => {
  if (!country) return false;
  return AU_COUNTRY_ALIASES.has(country.trim().toUpperCase());
};

export const calculateOrderTax = ({
  subtotal,
  shippingCountry,
  shippingFee = 0,
}: CalculateOrderTaxInput) => {
  const subtotalAmount = money(subtotal);
  const shippingAmount = money(shippingFee);
  const taxableAmount = subtotalAmount.plus(shippingAmount);
  const taxAmount = isAustralianShippingCountry(shippingCountry)
    ? money(taxableAmount.mul(GST_RATE))
    : new Prisma.Decimal(0);

  return {
    subtotal: subtotalAmount,
    shippingFee: shippingAmount,
    taxAmount,
    totalPrice: money(taxableAmount.plus(taxAmount)),
  };
};
