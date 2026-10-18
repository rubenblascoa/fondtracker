import { describe, it, expect } from "bun:test";
import { rateLimit, checkCSRF, securityHeaders } from "../middleware/security.middleware";

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

});
