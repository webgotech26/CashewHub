/**
 * Format a number as Indian Rupee currency.
 * Used by both customer storefront and admin ERP.
 */
export const formatPrice = (amount, options = {}) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    ...options,
  }).format(amount);

/** Status → color mapping used in order tables and badges */
export const ORDER_STATUS_COLORS = {
  pending:    { bg: '#FEF9C3', text: '#A16207', border: '#FDE68A' },
  confirmed:  { bg: '#DBEAFE', text: '#1D4ED8', border: '#BFDBFE' },
  processing: { bg: '#DBEAFE', text: '#1D4ED8', border: '#BFDBFE' },
  shipped:    { bg: '#E0F2FE', text: '#0369A1', border: '#BAE6FD' },
  delivered:  { bg: '#DCFCE7', text: '#15803D', border: '#BBF7D0' },
  cancelled:  { bg: '#FEE2E2', text: '#B91C1C', border: '#FECACA' },
};
