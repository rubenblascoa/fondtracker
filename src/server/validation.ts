export function validatePassword(pw: string): string | null {
  if (pw.length < 8) return "Mínimo 8 caracteres";
  if (!/[A-Z]/.test(pw)) return "Requiere al menos una mayúscula";
  if (!/[a-z]/.test(pw)) return "Requiere al menos una minúscula";
  if (!/[0-9]/.test(pw)) return "Requiere al menos un número";
  return null; // válida
}
