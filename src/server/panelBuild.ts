// Compilación del panel (src/client) para producción: minificado, con code splitting y nombres con hash.
// La usan `bun run build` y el servidor al arrancar en producción: el bundler en caliente de Bun
// (import de index.html) ignora el splitting y sirve un único JS de ~1,8 MB sin caché.
import tailwind from "bun-plugin-tailwind";
import publicAssets from "../../scripts/public-assets-plugin";
import { rm } from "node:fs/promises";
import { join } from "node:path";

/** URL bajo la que se sirven los archivos compilados (los nombres llevan hash: caché de un año). */
export const PANEL_ASSETS_PREFIX = "/assets/";

export async function buildPanel(projectRoot: string, outdir: string, opts: { sourcemap?: boolean } = {}) {
  await rm(outdir, { recursive: true, force: true });
  const result = await Bun.build({
    entrypoints: [join(projectRoot, "src/client/index.html")],
    outdir,
    publicPath: PANEL_ASSETS_PREFIX,
    plugins: [tailwind, publicAssets],
    minify: true,
    splitting: true,
    target: "browser",
    sourcemap: opts.sourcemap ? "linked" : "none",
    define: {
      "process.env.NODE_ENV": JSON.stringify("production"),
    },
  });
  if (!result.success) {
    throw new AggregateError(result.logs, "No se pudo compilar el panel");
  }
  return result.outputs;
}
