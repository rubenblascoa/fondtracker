import { StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { App } from "./App";

const elem = document.getElementById("root")!;
const tree = (
  <StrictMode>
    <App />
  </StrictMode>
);

declare global {
  interface ImportMeta {
    hot?: { data: { root?: Root } };
  }
}

const root = import.meta.hot
  ? (import.meta.hot.data.root ??= createRoot(elem))
  : createRoot(elem);

root.render(tree);

// ── Cloudflare Web Analytics Integration ───────────────────────────────────
fetch("/api/health")
  .then((res) => res.json())
  .then((data: any) => {
    if (data?.cloudflareBeaconToken) {
      const script = document.createElement("script");
      script.type = "module";
      script.src = "https://static.cloudflareinsights.com/beacon.min.js";
      script.setAttribute("data-cf-beacon", JSON.stringify({ token: data.cloudflareBeaconToken }));
      document.head.appendChild(script);
    }
  })
  .catch(() => {});
