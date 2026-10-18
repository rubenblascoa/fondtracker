import { describe, it, expect } from "bun:test";
import {
  signToken,
  verifyToken,
  hashPassword,
  verifyPassword,
  buildSessionCookie,
  buildLogoutCookie,
} from "../auth";
import { validatePassword } from "../validation";

describe("Auth Module & Security", () => {
  it("valida la complejidad de la contraseña correctamente", () => {
    expect(validatePassword("short")).toContain("Mínimo 8 caracteres");
    expect(validatePassword("lowercase123")).toContain("al menos una mayúscula");
    expect(validatePassword("UPPERCASE123")).toContain("al menos una minúscula");
    expect(validatePassword("NoNumbersHere")).toContain("al menos un número");
    expect(validatePassword("ValidPass123!")).toBeNull();
  });

  it("hashea y verifica contraseñas correctamente", async () => {
    const password = "SuperSecretPassword123!";
    const hash = await hashPassword(password);
    expect(hash).not.toBe(password);
    expect(await verifyPassword(password, hash)).toBe(true);
    expect(await verifyPassword("WrongPassword123!", hash)).toBe(false);
  });

  it("genera y verifica JWT tokens válidos", async () => {
    const payload = { sub: 42, username: "inversor_pro" };
    const token = await signToken(payload);
    expect(typeof token).toBe("string");
    expect(token.split(".").length).toBe(3);

    const verified = await verifyToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.sub).toBe(42);
    expect(verified?.username).toBe("inversor_pro");
    expect(verified?.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it("rechaza tokens manipulados o inválidos", async () => {
    const validToken = await signToken({ sub: 1, username: "admin" });
    const tamperedToken = validToken.slice(0, -5) + "abcde";
    expect(await verifyToken(tamperedToken)).toBeNull();
    expect(await verifyToken("random.garbage.token")).toBeNull();
    expect(await verifyToken("")).toBeNull();
  });

  it("construye cookies seguras HttpOnly con SameSite=Lax", () => {
    const token = "mock-token-xyz";
    const cookie = buildSessionCookie(token, 86400);
    expect(cookie).toContain("ft_session=mock-token-xyz");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Lax");
    expect(cookie).toContain("Path=/");
    expect(cookie).toContain("Max-Age=86400");
  });

  it("construye cookie de logout para invalidar sesión", () => {
    const logoutCookie = buildLogoutCookie();
    expect(logoutCookie).toContain("ft_session=");
    expect(logoutCookie).toContain("Max-Age=0");
    expect(logoutCookie).toContain("HttpOnly");
  });
});
