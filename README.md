# Bil Aka Kora, site officiel (concept)

Site statique écrit à la main : HTML, CSS et JavaScript, sans framework.

## Commandes

| Commande | Rôle |
|---|---|
| `node tools/serve.mjs` | Aperçu local sur http://localhost:4321/ |
| `node tools/build.mjs` | Construit tout : icônes, pages de musique, blocs communs, contrôle des symboles |
| `node tools/build-pages.mjs --check` | Signale les pages dont les blocs communs sont en retard |
| `node tools/check-symbols.mjs` | Signale les symboles typographiques bannis |
| `node tools/check-launch.mjs` | Liste ce qui reste à faire avant la mise en ligne |
| `node tools/build-styleguide.mjs <dossier> --fragment` | Version autonome du système de design, pour publication |

## Où modifier quoi

| Pour changer | Modifier | Puis |
|---|---|---|
| En-tête, menu, pied de page, feuille d'écoute, `<head>` commun | `partials/*.html` | `node tools/build.mjs` |
| Un album, une année, une liste de titres | `contenus/albums.json` | `node tools/build.mjs` |
| Un concert (à venir ou passé) | `contenus/concerts.json` | `node tools/build.mjs` (à relancer aussi quand une date passe) |
| Une photo de la galerie | `contenus/photos.json`, et ses deux fichiers dans `images/galerie/` (`nom.jpg` 1600 px max, `nom-720.jpg`) | `node tools/build.mjs` |
| Une vidéo (ajout, ordre, section) | `contenus/videos.json`, et sa vignette dans `images/videos/<id>.jpg` (960 × 540) | `node tools/build.mjs` |
| Une page écrite à la main (accueil, artiste, booking et presse) | le fichier `index.html` de la page, **hors** des marqueurs `@partial` | rien |
| Couleurs, typographie, espacements, durées | `css/tokens.css` | rien |
| Une icône | `icons/src/` (préfixe `ph-` ou `si-`) | `node tools/build.mjs` |

Tout ce qui se trouve entre `<!-- @partial nom -->` et `<!-- @end nom -->` est régénéré : ne pas y écrire à la main. Les pages `musique/**`, `videos/`, `concerts/` et `photos/` sont entièrement générées, ainsi que les blocs « prochains concerts » de l’accueil.

## Dossiers

- `sources/photos/` : photos originales, jamais publiées telles quelles.
- `images/` : images optimisées pour le site (pochettes, galerie, vignettes vidéo, photos de mise en page).

## Règles du projet

- Aucun filet de séparation : on sépare par l'espace ou par une card (`.card`).
- Symboles typographiques bannis : voir `contenus/textes.md`, section « Règles d'écriture ».
- Seuls les liens officiels fournis sont utilisés (Spotify, Instagram, YouTube).
