// Genera los recursos de marca a partir del logotipo (dos líneas de flujo):
//   public/favicon.ico          16, 32 y 48 px (PNG dentro de ICO)
//   public/apple-touch-icon.png 180 px, sin esquinas (iOS las redondea)
//   public/og-image.png         1200×630 para redes sociales
// Uso: node scripts/generate_brand_assets.mjs   (CHROME_PATH para otra ruta de Chrome)
import { chromium } from "playwright-core";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const CHROME = process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const pub = (f) => resolve("public", f);

const WAVES = `
  <path d="M2.5 9c2.5 0 2.5 4.2 5 4.2S10 9 12 9s2.5 4.2 5 4.2S19.5 9 21.5 9"/>
  <path d="M2.5 15c2.5 0 2.5 4.2 5 4.2S10 15 12 15s2.5 4.2 5 4.2S19.5 15 21.5 15" opacity="0.6"/>`;

const favicon = readFileSync(pub("favicon.svg"), "utf8");
const appleIcon = favicon.replace('rx="8"', 'rx="0"');

const ogHtml = `<!doctype html><html><head>
<link href="https://fonts.googleapis.com/css2?family=Onest:wght@400;500&display=block" rel="stylesheet">
<style>
  * { margin: 0; box-sizing: border-box; }
  body { width: 1200px; height: 630px; overflow: hidden; position: relative; background: #04050c; color: #eef0f6; font-family: "Onest", system-ui, sans-serif; }
  .blob { position: absolute; border-radius: 50%; filter: blur(70px); }
  .b1 { width: 520px; height: 520px; right: -60px; top: -120px; background: radial-gradient(closest-side, rgba(62, 224, 255, .55), transparent); }
  .b2 { width: 560px; height: 560px; right: 160px; bottom: -260px; background: radial-gradient(closest-side, rgba(209, 91, 255, .5), transparent); }
  .b3 { width: 420px; height: 420px; right: 300px; top: 60px; background: radial-gradient(closest-side, rgba(111, 123, 255, .45), transparent); }
  .scrim { position: absolute; inset: 0; background: linear-gradient(90deg, #04050c 30%, rgba(4, 5, 12, .5) 70%, rgba(4, 5, 12, .2)); }
  .content { position: absolute; inset: 0; padding: 80px 88px; display: flex; flex-direction: column; }
  .brand { display: flex; align-items: center; gap: 16px; font-size: 36px; font-weight: 500; letter-spacing: -0.01em; }
  .brand svg { width: 46px; height: 46px; }
  h1 { margin-top: auto; font-size: 78px; font-weight: 500; line-height: 1.04; letter-spacing: -0.035em; max-width: 820px; }
  h1 span { background: linear-gradient(90deg, #3ee0ff, #6f7bff 45%, #d15bff); -webkit-background-clip: text; background-clip: text; color: transparent; }
  p { margin-top: 26px; font-size: 28px; line-height: 1.4; color: #b9becf; max-width: 760px; }
</style></head><body>
  <div class="blob b1"></div><div class="blob b2"></div><div class="blob b3"></div><div class="scrim"></div>
  <div class="content">
    <div class="brand"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round">${WAVES}</svg>FondTracker</div>
    <h1>Todo tu dinero, <span>en una sola vista.</span></h1>
    <p>Fondos de inversión y ETFs de todos tus bancos, valorados con el precio oficial. Gratis.</p>
  </div>
</body></html>`;

const browser = await chromium.launch({ headless: true, executablePath: CHROME });
const page = await browser.newPage({ deviceScaleFactor: 1 });

async function renderSvg(svg, size) {
  const sized = svg.replace(/width="\d+" height="\d+"/, `width="${size}" height="${size}"`);
  // Ventana normal y recorte: Chrome no admite ventanas diminutas
  await page.setViewportSize({ width: 400, height: 400 });
  await page.setContent(`<html><body style="margin:0;background:transparent">${sized}</body></html>`);
  return page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
}

// ICO con imágenes PNG embebidas (formato admitido por todos los navegadores actuales)
function buildIco(images) {
  const header = Buffer.alloc(6 + images.length * 16);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, png }, i) => {
    const e = 6 + i * 16;
    header.writeUInt8(size >= 256 ? 0 : size, e);
    header.writeUInt8(size >= 256 ? 0 : size, e + 1);
    header.writeUInt8(0, e + 2);
    header.writeUInt8(0, e + 3);
    header.writeUInt16LE(1, e + 4);
    header.writeUInt16LE(32, e + 6);
    header.writeUInt32LE(png.length, e + 8);
    header.writeUInt32LE(offset, e + 12);
    offset += png.length;
  });
  return Buffer.concat([header, ...images.map((i) => i.png)]);
}

const icoImages = [];
for (const size of [16, 32, 48]) icoImages.push({ size, png: await renderSvg(favicon, size) });
writeFileSync(pub("favicon.ico"), buildIco(icoImages));
writeFileSync(pub("apple-touch-icon.png"), await renderSvg(appleIcon, 180));

await page.setViewportSize({ width: 1200, height: 630 });
await page.setContent(ogHtml, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
writeFileSync(pub("og-image.png"), await page.screenshot({ clip: { x: 0, y: 0, width: 1200, height: 630 } }));

await browser.close();
console.log("favicon.ico, apple-touch-icon.png y og-image.png generados en public/");
