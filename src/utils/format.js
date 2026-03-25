export function money(value = 0) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(value);
}

export function whatsappLink(number, text = 'Hello, I found your service on PeezuHub.') {
  const clean = (number || '').replace(/[^\d]/g, '');
  return `https://wa.me/${clean}?text=${encodeURIComponent(text)}`;
}

export function truncate(text = '', max = 120) {
  return text.length > max ? `${text.slice(0, max)}...` : text;
}
