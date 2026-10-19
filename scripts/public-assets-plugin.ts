import type { BunPlugin } from "bun";

/**
 * Deja sin empaquetar las rutas absolutas a /fonts/… (las sirve el servidor desde public/).
 * Sin esto Bun mete cada woff2 en base64 dentro del CSS y lo infla cientos de KB.
 */
const publicAssets: BunPlugin = {
  name: "public-assets",
  setup(build) {
    build.onResolve({ filter: /^\/fonts\// }, (args) => ({ path: args.path, external: true }));
  },
};

export default publicAssets;
