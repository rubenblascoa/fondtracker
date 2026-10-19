// Metadatos de cada página de la app (título, descripción, canónica, hreflang, Open Graph y robots).
// La landing (index.html) los trae escritos; aquí se ponen para login, registro, legales y el panel.

export type Seo = {
  title: string;
  description?: string;
  /** Ruta canónica (sin dominio). Si falta, la página no se ofrece a los buscadores. */
  path?: string;
  /** false → noindex (panel, admin…) */
  index?: boolean;
};

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

function upsertLink(selector: string, attrs: Record<string, string>) {
  let el = document.head.querySelector<HTMLLinkElement>(selector);
  if (!el) {
    el = document.createElement("link");
    document.head.appendChild(el);
  }
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
}

export function applySeo({ title, description, path, index = true }: Seo) {
  document.title = title;
  upsertMeta("name", "robots", index ? "index, follow, max-image-preview:large" : "noindex, nofollow");
  if (description) {
    upsertMeta("name", "description", description);
    upsertMeta("property", "og:description", description);
    upsertMeta("name", "twitter:description", description);
  }
  upsertMeta("property", "og:title", title);
  upsertMeta("name", "twitter:title", title);
  if (path) {
    const url = window.location.origin + path;
    upsertLink('link[rel="canonical"]', { rel: "canonical", href: url });
    upsertLink('link[rel="alternate"][hreflang="es"]', { rel: "alternate", hreflang: "es", href: url });
    upsertLink('link[rel="alternate"][hreflang="x-default"]', { rel: "alternate", hreflang: "x-default", href: url });
    upsertMeta("property", "og:url", url);
  }
}
