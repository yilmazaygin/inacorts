export function whatsappUrl(phone: string, text: string): string | null {
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('0')) digits = `90${digits.slice(1)}`;
  else if (digits.length === 10) digits = `90${digits}`;
  if (digits.length < 11) return null;
  const message = text.trim();
  return message
    ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
    : `https://wa.me/${digits}`;
}
