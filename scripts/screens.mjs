// Capturas headless de toda la app para revisar el rediseño.
// Uso: node scripts/screens.mjs [etiqueta] [--light] [--base=http://localhost:3741]
// Credenciales por env: SCREENS_USER, SCREENS_PASS. Salida: .superpowers/screens/<etiqueta>/
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const args = process.argv.slice(2);
const label = args.find((a) => !a.startsWith("--")) ?? new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
const light = args.includes("--light");
const base = (args.find((a) => a.startsWith("--base="))?.slice(7)) ?? "http://localhost:3741";
const out = `.superpowers/screens/${label}${light ? "-light" : ""}`;
mkdirSync(out, { recursive: true });

const CHROME = process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
// Etiquetas del menú (antiguas y nuevas) → nombre de archivo
const SECTIONS = [
  [["Resumen", "Dashboard"], "10-resumen"],
  [["Mi cartera", "Mis Inversiones"], "11-cartera"],
  [["Añadir fondo", "Añadir Inversión"], "12-anadir"],
  [["Análisis", "Analitica & Asset", "Analítica & Asset"], "13-analisis"],
  [["WhatsApp", "Alertas WhatsApp"], "14-whatsapp"],
  [["Informes", "Exportar & Informes"], "15-informes"],
  [["Admin", "Panel de Admin"], "16-admin"],
  [["API", "Documentación & APIs"], "17-api"],
];

const browser = await chromium.launch({ headless: true, executablePath: CHROME });
const settle = (p, ms = 2500) => p.waitForTimeout(ms);

async function publicPages(width, suffix) {
  const page = await (await browser.newContext({ viewport: { width, height: 900 } })).newPage();
  for (const [path, name] of [["/", "01-landing"], ["/login", "02-login"], ["/register", "03-registro"], ["/legal", "04-legal"]]) {
    await page.goto(base + path, { waitUntil: "networkidle", timeout: 90_000 });
    for (let y = 0; y < 8000; y += 500) { await page.mouse.wheel(0, 500); await page.waitForTimeout(120); }
    await settle(page, 1200);
    await page.screenshot({ path: `${out}/${name}${suffix}.png`, fullPage: true });
  }
}

await publicPages(1440, "");
await publicPages(390, "-movil");

if (process.env.SCREENS_USER && process.env.SCREENS_PASS) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await ctx.newPage();
  await page.goto(base + "/login", { waitUntil: "networkidle" });
  await page.evaluate(async ([u, p, theme]) => {
    const r = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ identifier: u, password: p }) });
    const { token } = await r.json();
    sessionStorage.setItem("fondtracker_token", token);
    document.cookie = `ft_session=${encodeURIComponent(token)}; path=/; SameSite=Strict; max-age=86400`;
    localStorage.setItem("fondtracker_theme", theme);
  }, [process.env.SCREENS_USER, process.env.SCREENS_PASS, light ? "light" : "dark"]);
  await page.goto(base + "/dashboard", { waitUntil: "networkidle" });
  await settle(page, 6000);
  for (const [labels, name] of SECTIONS) {
    let clicked = false;
    for (const l of labels) {
      const el = page.getByText(l, { exact: true }).first();
      if (await el.count()) { await el.click().catch(() => {}); clicked = true; break; }
    }
    if (!clicked) { console.log("sin sección:", labels[0]); continue; }
    await settle(page, 5000);
    await page.screenshot({ path: `${out}/${name}.png`, fullPage: true });
  }
  const mob = await (await browser.newContext({ viewport: { width: 390, height: 844 }, storageState: await ctx.storageState() })).newPage();
  await mob.goto(base + "/dashboard", { waitUntil: "networkidle" });
  await mob.evaluate(async ([u, p]) => {
    const r = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ identifier: u, password: p }) });
    sessionStorage.setItem("fondtracker_token", (await r.json()).token);
  }, [process.env.SCREENS_USER, process.env.SCREENS_PASS]);
  await mob.reload({ waitUntil: "networkidle" });
  await settle(mob, 6000);
  await mob.screenshot({ path: `${out}/20-resumen-movil.png`, fullPage: true });
}

await browser.close();
console.log("capturas en", out);
