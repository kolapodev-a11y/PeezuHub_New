export function money(value = 0) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(value);
}

export function normalizeWhatsAppNumber(number = '') {
  const digits = String(number).replace(/\D/g, '');
  if (!digits) return '';

  // Common Nigerian local mobile format: 080..., 090..., 070..., 081...
  if (digits.startsWith('0') && digits.length === 11) {
    return `234${digits.slice(1)}`;
  }

  // Common user mistake: +234080... or 234080... (extra 0 kept after country code)
  if (digits.startsWith('2340') && digits.length === 14) {
    return `234${digits.slice(4)}`;
  }

  // Already in valid Nigerian international format: 23480..., 23490..., etc.
  if (digits.startsWith('234') && digits.length === 13) {
    return digits;
  }

  // Another acceptable local variant without leading zero: 806..., 906..., etc.
  if (!digits.startsWith('0') && !digits.startsWith('234') && digits.length === 10) {
    return `234${digits}`;
  }

  return digits;
}

export function whatsappLink(number, text = 'Hello, I found your listing on PeezuHub. Is it still available?') {
  const clean = normalizeWhatsAppNumber(number);
  return clean ? `https://wa.me/${clean}?text=${encodeURIComponent(text)}` : '#';
}

export function truncate(text = '', max = 120) {
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

export function formatDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}
