/**
 * Utility functions for masking sensitive PII/Financial data on the client side.
 */

export const maskPAN = (pan) => {
  if (!pan || pan.length !== 10) return pan;
  return `XXXX-XX${pan.substring(6, 10)}`;
};

export const maskMobile = (mobile) => {
  if (!mobile || mobile.length < 10) return mobile;
  return `XXXXX-X${mobile.substring(6)}`;
};

export const maskAccountNumber = (accNumber) => {
  if (!accNumber || accNumber.length < 4) return accNumber;
  return `XXXX-XXXX-${accNumber.substring(accNumber.length - 4)}`;
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};
