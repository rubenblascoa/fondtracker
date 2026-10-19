// Descarga las tipografías de Google Fonts y las deja en el proyecto, para que la web no dependa de
// servidores externos (privacidad: Google ya no ve la IP de cada visitante; y funciona aunque caiga).
//   src/client/fonts/<familia>/*.woff2 + src/client/fonts/fonts.css  → panel (lo empaqueta Bun)
//   public/fonts/<familia>/*.woff2 + public/fonts/fonts.css          → landing estática (servida en /fonts)
// Uso: bun scripts/download_fonts.ts
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const FAMILIES = [
  { family: "Inter", axis: "wght@400..700", dir: "inter" },
  { family: "Space Grotesk", axis: "wght@500..700", dir: "space-grotesk" },
  { family: "JetBrains Mono", axis: "wght@400..700", dir: "jetbrains-mono" },
  { family: "Onest", axis: "wght@400..600", dir: "onest" },
];
// Alfabetos latinos: cubren español (tildes, ñ, ¿¡, €) y nombres de otros idiomas europeos
const SUBSETS = new Set(["latin", "latin-ext"]);
// Un navegador moderno recibe woff2 variables
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36";

type Face = { family: string; subset: string; css: string; file: string; dir: string };

async function facesFor({ family, axis, dir }: (typeof FAMILIES)[number]): Promise<Face[]> {
  const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, "+")}:${axis}&display=swap`;
  const css = await (await fetch(url, { headers: { "User-Agent": UA } })).text();
  const faces: Face[] = [];
  for (const m of css.matchAll(/\/\*\s*([a-z-]+)\s*\*\/\s*(@font-face\s*{[^}]+})/g)) {
    const [, subset, block] = m;
    if (!SUBSETS.has(subset)) continue;
    const src = block.match(/url\((https:[^)]+\.woff2)\)/)?.[1];
    if (!src) throw new Error(`Sin woff2 para ${family} ${subset}`);
    faces.push({ family, subset, css: block, file: `${dir}-${subset}.woff2`, dir });
    const bytes = new Uint8Array(await (await fetch(src)).arrayBuffer());
    mkdirSync(join("src/client/fonts", dir), { recursive: true });
    writeFileSync(join("src/client/fonts", dir, `${dir}-${subset}.woff2`), bytes);
    console.log(`  ${family} ${subset}: ${(bytes.length / 1024).toFixed(1)} KB`);
    // Copia para la landing estática (servida en /fonts)
    mkdirSync(join("public/fonts", dir), { recursive: true });
    writeFileSync(join("public/fonts", dir, `${dir}-${subset}.woff2`), bytes);
  }
  return faces;
}

const faces = (await Promise.all(FAMILIES.map(facesFor))).flat();
const header = "/* Generado por scripts/download_fonts.ts — tipografías servidas desde la propia web. */\n";
const toCss = (prefix: (f: Face) => string) =>
  header + faces.map((f) => `/* ${f.family} · ${f.subset} */\n` + f.css.replace(/url\(https:[^)]+\.woff2\)/, `url(${prefix(f)}${f.file})`)).join("\n") + "\n";

writeFileSync("src/client/fonts/fonts.css", toCss((f) => `./${f.dir}/`));
writeFileSync("public/fonts/fonts.css", toCss((f) => `/fonts/${f.dir}/`));
console.log(`${faces.length} archivos de tipografía guardados.`);
