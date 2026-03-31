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

  if (digits.startsWith('234') && digits.length >= 13) {
    return digits;
  }

  if (digits.startsWith('0') && digits.length === 11) {
    return `234${digits.slice(1)}`;
  }

  if (!digits.startsWith('0') && !digits.startsWith('234') && digits.length === 10) {
    return `234${digits}`;
  }

  return digits;
}

export function whatsappLink(number, text = 'Hello, I found your listing on PeezuHub. Is it still available?') {
  const clean = normalizeWhatsAppNumber(number);
  return `https://wa.me/${clean}?text=${encodeURIComponent(text)}`;
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
