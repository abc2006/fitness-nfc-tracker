export interface BirthDateInputResult {
  displayValue: string;
  isoValue: string | null;
  error: string | null;
}

export function parseBirthDateInput(raw: string): BirthDateInputResult {
  const digits = raw.replace(/\D/g, '').slice(0, 8);

  if (digits.length < 8) {
    let displayValue = digits;
    if (digits.length > 4) displayValue = `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`;
    else if (digits.length > 2) displayValue = `${digits.slice(0, 2)}.${digits.slice(2)}`;
    return { displayValue, isoValue: null, error: null };
  }

  const day = parseInt(digits.slice(0, 2), 10);
  const month = parseInt(digits.slice(2, 4), 10);
  const year = parseInt(digits.slice(4, 8), 10);
  const date = new Date(year, month - 1, day);
  const currentYear = new Date().getFullYear();
  const isValid =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day &&
    year >= 1900 &&
    year <= currentYear;

  const displayValue = `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`;

  if (!isValid) {
    return { displayValue, isoValue: null, error: 'Ungültiges Datum' };
  }

  return { displayValue, isoValue: `${digits.slice(4)}-${digits.slice(2, 4)}-${digits.slice(0, 2)}`, error: null };
}

export function isoDateToDisplay(iso: string | null): string {
  if (!iso) return '';
  const [year, month, day] = iso.split('-');
  if (!year || !month || !day) return '';
  return `${day}.${month}.${year}`;
}
