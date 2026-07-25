// Normalizes what someone types into a plain digit-string phone number,
// matching the "255712345678" convention already used for the WhatsApp
// business field (see app/profile/page.js). Defaults a local "0..." number
// to Tanzania's country code, since that's the app's primary market.
const DEFAULT_COUNTRY_CODE = '255';

export function normalizePhone(input) {
  if (!input) return '';
  let digits = input.replace(/\D/g, '');
  if (digits.startsWith('0')) {
    digits = DEFAULT_COUNTRY_CODE + digits.slice(1);
  }
  return digits;
}

export function isValidPhone(digits) {
  return /^\d{9,15}$/.test(digits);
}

// Supabase's password auth needs an email-shaped identifier under the hood.
// The real number lives in profiles.phone (see phone_login_migration.sql) —
// this synthetic address is only ever used to talk to supabase.auth.
export function phoneToSyntheticEmail(digits) {
  return `${digits}@phone.advat.local`;
}
