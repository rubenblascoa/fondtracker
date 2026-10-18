import { describe, it, expect } from "bun:test";
import { rateLimit, checkCSRF, securityHeaders } from "../middleware/security.middleware";
import { fundRoutes } from "../routes/funds.routes";

describe("API Security & Routing", () => {
  it("aplica cabeceras de seguridad CSP y X-Content-Type-Options", () => {
    const headers = securityHeaders();
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["X-Frame-Options"]).toBe("DENY");
    expect(headers["Content-Security-Policy"]).toContain("default-src 'self'");
  });

  it("bloquea peticiones tras superar el límite de rate limiting", () => {
    const ip = "192.168.1.100";
    const ns = "test-rate-limit";
    // 3 allowed
    expect(rateLimit(ns, ip, 3)).toBe(false);
    expect(rateLimit(ns, ip, 3)).toBe(false);
    expect(rateLimit(ns, ip, 3)).toBe(false);
    // 4th is blocked
    expect(rateLimit(ns, ip, 3)).toBe(true);
  });

  it("devuelve lista de bancos oficiales en el endpoint /api/banks", async () => {
    const res = await (fundRoutes["/api/banks"] as any).GET();
    const data = await res.json();
    expect(data["Santander"]).toBeDefined();
    expect(data["BBVA"]).toBeDefined();
    expect(data["Vanguard"]).toBeDefined();
    expect(data["MyInvestor"]).toBeDefined();
  });
});
