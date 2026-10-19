import path from "node:path";
import { buildPanel } from "./src/server/panelBuild";

const outputs = await buildPanel(process.cwd(), path.join(process.cwd(), "dist"), { sourcemap: true });

for (const output of outputs) {
  console.log(
    ` ${path.relative(process.cwd(), output.path)}  ${(output.size / 1024).toFixed(1)} KB`
  );
}
