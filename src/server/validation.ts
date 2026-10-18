export function validatePassword(pw: string): string | null {
  if (pw.length < 8) return "Mínimo 8 caracteres";
  if (!/[A-Z]/.test(pw)) return "Requiere al menos una mayúscula";
  if (!/[a-z]/.test(pw)) return "Requiere al menos una minúscula";
  if (!/[0-9]/.test(pw)) return "Requiere al menos un número";
  return null; // válida
}

/**
 * Nombre con el que se saluda al usuario: letras (con tildes), espacios, apóstrofo, guion y punto,
 * empezando por letra y de 40 caracteres como mucho. Vacío = sin nombre (se usa el de usuario).
 */
export function normalizeDisplayName(raw: string): { ok: true; value: string | null } | { ok: false; error: string } {
  const value = raw.trim().replace(/\s+/g, " ");
  if (!value) return { ok: true, value: null };
  if (value.length > 40) return { ok: false, error: "El nombre puede tener como mucho 40 caracteres" };
  if (!/^\p{L}[\p{L}\p{M} '.-]*$/u.test(value)) return { ok: false, error: "Usa solo letras, espacios, guiones o apóstrofos" };
  return { ok: true, value };
}
