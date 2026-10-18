import { getUserFromRequest } from "../auth";
import { unauthorized, json } from "./security.middleware";

export async function requireUser(req: Request): Promise<{ id: number; username: string; is_admin: boolean } | Response> {
  const user = await getUserFromRequest(req);
  if (!user) return unauthorized();
  return user;
}

export async function requireAdmin(req: Request): Promise<{ id: number; username: string; is_admin: boolean } | Response> {
  const user = await getUserFromRequest(req);
  if (!user) return unauthorized();
  if (!user.is_admin) return json({ error: "Acceso denegado" }, { status: 403 });
  return user;
}
