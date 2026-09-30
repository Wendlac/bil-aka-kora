// Langues du site : adresses des rubriques, textes d'interface des pages
// générées, formats de date. Le français est la langue de référence : ses
// adresses sont à la racine, l'anglais vit sous en/.

export const LANGS = ["fr", "en"];

/** Rubriques : clé = adresse française, valeur = adresse anglaise. */
export const SECTIONS = {
  musique: "music",
  videos: "videos",
  concerts: "shows",
  photos: "photos",
  "bil-aka-kora": "bil-aka-kora",
  pro: "press",
  "mentions-legales": "legal",
};

const EN_TO_FR = Object.fromEntries(Object.entries(SECTIONS).map(([fr, en]) => [en, fr]));

/** Segments d'une adresse française -> segments anglais (la rubrique est traduite, le reste gardé). */
export const toEnglishPath = (segments) => (segments.length ? [SECTIONS[segments[0]] ?? segments[0], ...segments.slice(1)] : []);
/** Segments d'une adresse anglaise (sans « en ») -> segments français. */
export const toFrenchPath = (segments) => (segments.length ? [EN_TO_FR[segments[0]] ?? segments[0], ...segments.slice(1)] : []);

/** Chemin d'une rubrique depuis la racine, selon la langue : section("musique", "en") -> "en/music/". */
export const section = (key, lang) => (lang === "en" ? `en/${SECTIONS[key]}/` : `${key}/`);

const MONTHS = {
  fr: ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};
const MONTHS_LONG = {
  fr: ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
};
const DAYS = {
  fr: ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"],
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
};

export const dateParts = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m, d, weekday: new Date(Date.UTC(y, m - 1, d)).getUTCDay() };
};
export const monthShort = (m, lang) => MONTHS[lang][m - 1];
/** « vendredi 31 juillet 2026 » / « Friday 31 July 2026 » */
export const fullDate = (iso, lang) => {
  const { y, m, d, weekday } = dateParts(iso);
  return `${DAYS[lang][weekday]} ${d} ${MONTHS_LONG[lang][m - 1]} ${y}`;
};
/** « 19 décembre 2019 » / « 19 December 2019 » */
export const longDate = (iso, lang) => {
  const { y, m, d } = dateParts(iso);
  return `${d} ${MONTHS_LONG[lang][m - 1]} ${y}`;
};

const WORDS = {
  fr: ["zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix", "onze", "douze"],
  en: ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"],
};
export const inWords = (n, lang = "fr") => WORDS[lang][n] ?? String(n);
export const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/** Choisit la valeur de la langue : champ « x_en » en anglais s'il existe, sinon « x ». */
export const pick = (obj, field, lang) => (lang === "en" && obj[`${field}_en`] !== undefined ? obj[`${field}_en`] : obj[field]);

/** Textes d'interface communs aux pages générées. */
export const UI = {
  fr: {
    siteTitle: "Bil Aka Kora",
    listen: "Écouter",
    play: "Lire la vidéo",
    with: "Avec",
    programmers: "Programmateurs",
    programmersTitle: "Vous programmez un festival ou une salle ?",
    programmersText: "Vidéo live, kit presse, fiche technique et contact : tout est réuni sur une seule page.",
    bookingLink: "Booking et presse",
    bookTitle: "Programmer Bil Aka Kora et le Djongo System.",
    ogLocale: "fr_FR",
  },
  en: {
    siteTitle: "Bil Aka Kora",
    listen: "Listen",
    play: "Play video",
    with: "With",
    programmers: "Programmers",
    programmersTitle: "Booking a festival or a venue?",
    programmersText: "Live video, press kit, tech rider and contact details, all on one page.",
    bookingLink: "Booking and press",
    bookTitle: "Book Bil Aka Kora and the Djongo System.",
    ogLocale: "en_GB",
  },
};
