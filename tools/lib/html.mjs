// Outils partagés par les générateurs de pages (build-albums, build-videos).

export const marker = (name) => `<!-- @partial ${name} -->\n(régénéré par tools/build-pages.mjs)\n<!-- @end ${name} -->`;

export const icon = (root, name, extra = "") =>
  `<svg class="icon" aria-hidden="true"${extra}><use href="${root}icons/sprite.svg#i-${name}"></use></svg>`;

export const esc = (text) => String(text).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

export const strip = (html) => html.replace(/<[^>]+>/g, "");

export const inWords = (n) => ["Zéro", "Un", "Deux", "Trois", "Quatre", "Cinq", "Six", "Sept", "Huit", "Neuf", "Dix"][n] ?? String(n);

/** Squelette d'une page générée : blocs communs en marqueurs, contenu dans <main>. */
export function page({ root, title, description, image, css, ogType = "website", lang = "fr", body }) {
  const home = lang === "en" ? `${root}en/` : root;
  return `<!doctype html>
<html lang="${lang}">
<head>
${marker("head")}
<title>${title}</title>
<meta name="description" content="${esc(description)}">
<meta property="og:type" content="${ogType}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${image}">
<meta property="og:locale" content="${lang === "en" ? "en_GB" : "fr_FR"}">
<link rel="stylesheet" href="${root}css/${css}">
</head>
<body>

${marker("header")}

<div class="masthead">
  <a class="logotype" href="${home}">Bil Aka Kora</a>
</div>

<main id="contenu">
${body}
</main>

${marker("footer")}

${marker("listen")}

${marker("scripts")}
</body>
</html>
`;
}
