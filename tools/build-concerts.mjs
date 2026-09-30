// Génère, en français et en anglais, à partir de contenus/concerts.json :
//   - concerts/index.html, en/shows/index.html        la page Concerts
//   - partials/next-concerts(.en).html                les trois prochaines dates, pour l'accueil
//   - partials/hero-concert(.en).html                 la seconde moitié de la ligne basse du hero
// À venir ou passé est décidé à la date de construction.
//
// Usage : node tools/build-concerts.mjs [AAAA-MM-JJ]   (date de référence, pour tester)

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { page, icon } from "./lib/html.mjs";
import { LANGS, UI, section, dateParts, monthShort, fullDate, longDate, capitalize, pick } from "./lib/i18n.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const { concerts } = JSON.parse(await readFile(join(root, "contenus", "concerts.json"), "utf8"));

const today = process.argv[2] ?? new Date().toISOString().slice(0, 10);
const upcoming = concerts.filter((c) => c.date >= today).sort((a, b) => a.date.localeCompare(b.date));
const past = concerts.filter((c) => c.date < today).sort((a, b) => b.date.localeCompare(a.date));

const T = {
  fr: {
    tickets: "Billets",
    details: "Détails",
    report: "Le récit",
    none: "Aucune date annoncée pour le moment.",
    pastLink: "Voir les concerts passés",
    heroNext: "Prochain concert :",
    heroLive: "En live :",
    heroLiveLink: "voir <em>Dibayagui</em>",
    kicker: "Concerts",
    title: "Sur scène",
    intro: "Le Djongo se vit d'abord en live, avec le Djongo System.",
    upcomingLabel: "À venir",
    upcomingTitle: "Prochaines dates",
    pastLabel: "Archives",
    pastTitle: "Concerts passés",
    pageTitle: "Concerts : Bil Aka Kora et le Djongo System sur scène",
    pageNext: (c) => `Prochain concert de Bil Aka Kora : ${c.ville}, le ${longDate(c.date, "fr")}. Dates à venir et concerts passés.`,
    pageNone: "Dates à venir et concerts passés de Bil Aka Kora et du Djongo System, au Burkina Faso et ailleurs.",
  },
  en: {
    tickets: "Tickets",
    details: "Details",
    report: "Read the report",
    none: "No upcoming dates yet.",
    pastLink: "See past shows",
    heroNext: "Next show:",
    heroLive: "Live:",
    heroLiveLink: "watch <em>Dibayagui</em>",
    kicker: "Shows",
    title: "On stage",
    intro: "Djongo is first of all a live experience, with the Djongo System.",
    upcomingLabel: "Upcoming",
    upcomingTitle: "Next dates",
    pastLabel: "Archive",
    pastTitle: "Past shows",
    pageTitle: "Shows: Bil Aka Kora and the Djongo System on stage",
    pageNext: (c) => `Next show by Bil Aka Kora: ${c.ville}, ${longDate(c.date, "en")}. Upcoming dates and past shows.`,
    pageNone: "Upcoming dates and past shows by Bil Aka Kora and the Djongo System, in Burkina Faso and beyond.",
  },
};

/** Card d'un concert. `r` est le chemin vers la racine ({{root}} dans un partial). */
function eventCard(c, r, lang, { isPast }) {
  const t = T[lang];
  const { y, m, d } = dateParts(c.date);
  const ext = icon(r, "arrow-up-right", " data-external");
  const link = isPast
    ? c.lien && `<a class="event__action link-arrow" href="${c.lien}" target="_blank" rel="noopener">${pick(c, "lienLibelle", lang) ?? t.report} ${ext}</a>`
    : c.billets
      ? `<a class="event__action link-arrow" href="${c.billets}" target="_blank" rel="noopener">${t.tickets} ${ext}</a>`
      : c.lien && `<a class="event__action link-arrow" href="${c.lien}" target="_blank" rel="noopener">${t.details} ${ext}</a>`;
  return `<li class="event${isPast ? " event--past" : ""}">
  <p class="event__date"><time datetime="${c.date}"><span class="event__day">${d}</span> <span class="label">${capitalize(monthShort(m, lang))} ${y}</span></time><span class="visually-hidden">, ${fullDate(c.date, lang)}</span></p>
  <div class="event__where">
    <p class="event__place">${c.ville}, ${c.pays}</p>
    <p class="event__venue">${[c.lieu, pick(c, "heure", lang)].filter(Boolean).join(", ")}</p>
  </div>
  <p class="event__name">${pick(c, "nom", lang)}</p>
  ${link || ""}
</li>`;
}

const indent = (html, n) => html.split("\n").map((l) => (l ? " ".repeat(n) + l : l)).join("\n");

/** Aucun concert à venir : on renvoie vers les archives (le booking a sa propre card juste en dessous). */
const emptyState = (r, lang, archivesHref) => `<div class="empty-state">
  <p class="lead">${T[lang].none}</p>${past.length ? `
  <a class="link-arrow" href="${archivesHref}">${T[lang].pastLink} ${icon(r, "arrow-right")}</a>` : ""}
</div>`;

for (const lang of LANGS) {
  const t = T[lang];
  const ui = UI[lang];
  const suffix = lang === "fr" ? "" : `.${lang}`;

  /* ---- Partials de l'accueil (variables résolues par build-pages) -------- */

  const nextConcerts = upcoming.length
    ? `<ul class="events">\n${upcoming.slice(0, 3).map((c) => indent(eventCard(c, "{{root}}", lang, { isPast: false }), 2)).join("\n")}\n</ul>`
    : emptyState("{{root}}", lang, "{{s:concerts}}#passes");

  const heroConcert = upcoming.length
    ? (() => {
        const { d, m } = dateParts(upcoming[0].date);
        const when = lang === "en" ? `${d} ${monthShort(m, lang)}` : `${d} ${monthShort(m, lang)}`;
        return `<span>${t.heroNext} <a class="link-arrow" href="{{s:concerts}}">${when}, ${upcoming[0].ville} ${icon("{{root}}", "arrow-right")}</a></span>`;
      })()
    : `<span>${t.heroLive} <a class="link-arrow" href="{{s:videos}}">${t.heroLiveLink} ${icon("{{root}}", "arrow-right")}</a></span>`;

  await writeFile(join(root, "partials", `next-concerts${suffix}.html`), nextConcerts + "\n");
  await writeFile(join(root, "partials", `hero-concert${suffix}.html`), heroConcert + "\n");

  /* ---- Page Concerts ----------------------------------------------------- */

  const r = lang === "en" ? "../../" : "../";
  const years = [...new Set(past.map((c) => dateParts(c.date).y))];
  const archives = years
    .map(
      (year) => `      <section class="concerts-year" aria-labelledby="year-${year}">
        <h3 class="concerts-year__title" id="year-${year}">${year}</h3>
        <ul class="events">
${past
  .filter((c) => dateParts(c.date).y === year)
  .map((c) => indent(eventCard(c, r, lang, { isPast: true }), 10))
  .join("\n")}
        </ul>
      </section>`
    )
    .join("\n");

  const body = `  <div class="container concerts">
    <header class="page-head">
      <p class="label">${t.kicker}</p>
      <h1>${t.title}</h1>
      <p class="page-head__intro">${t.intro}</p>
    </header>

    <section class="concerts__block" aria-labelledby="upcoming">
      <header class="section-head">
        <p class="label">${t.upcomingLabel}</p>
        <h2 id="upcoming">${t.upcomingTitle}</h2>
      </header>
${
  upcoming.length
    ? `      <ul class="events">\n${upcoming.map((c) => indent(eventCard(c, r, lang, { isPast: false }), 8)).join("\n")}\n      </ul>`
    : indent(emptyState(r, lang, "#passes"), 6)
}
    </section>

    <div class="card-grid">
      <div class="card card--stack">
        <!-- @partial subscribe -->
        (régénéré par tools/build-pages.mjs)
        <!-- @end subscribe -->
      </div>
      <div class="card card--stack">
        <p class="label">${ui.programmers}</p>
        <p class="card__title">${ui.programmersTitle}</p>
        <p>${ui.programmersText}</p>
        <a class="link-arrow" href="${r}${section("pro", lang)}">${ui.bookingLink} ${icon(r, "arrow-right")}</a>
      </div>
    </div>
${
  past.length
    ? `
    <section class="concerts__block" aria-labelledby="passes">
      <header class="section-head">
        <p class="label">${t.pastLabel}</p>
        <h2 id="passes">${t.pastTitle}</h2>
      </header>
${archives}
    </section>`
    : ""
}
  </div>`;

  const dir = join(root, section("concerts", lang));
  await mkdir(dir, { recursive: true });
  await writeFile(
    join(dir, "index.html"),
    page({
      root: r,
      lang,
      title: t.pageTitle,
      description: upcoming.length ? t.pageNext(upcoming[0]) : t.pageNone,
      image: `${r}images/photos/danse-djongo.jpg`,
      css: "concerts.css",
      body,
    })
  );
  console.log(`Écrit : ${section("concerts", lang)}index.html et partials/*-concert(s)${suffix}.html`);
}
console.log(`${upcoming.length} à venir, ${past.length} passé${past.length > 1 ? "s" : ""} (référence ${today})`);
