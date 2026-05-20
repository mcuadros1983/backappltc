export function normalizePhone(phone) {
  if (!phone) return null;

  const cleaned = String(phone).replace(/\D/g, "");

  if (!cleaned) return null;

  if (cleaned.startsWith("549")) return cleaned;
  if (cleaned.startsWith("54")) return `549${cleaned.slice(2)}`;
  if (cleaned.startsWith("9")) return `54${cleaned}`;

  return cleaned;
}

export default normalizePhone;