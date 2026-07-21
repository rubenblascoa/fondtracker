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

// ── Umami Cloud Analytics Integration ──────────────────────────────────────
fetch("/api/health")
  .then((res) => res.json())
  .then((data: any) => {
    if (data?.umamiWebsiteId) {
      const script = document.createElement("script");
      script.defer = true;
      script.src = "https://cloud.umami.is/script.js";
      script.setAttribute("data-website-id", data.umamiWebsiteId);
      document.head.appendChild(script);
    }
  })
  .catch(() => {});
