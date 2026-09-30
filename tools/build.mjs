// Construit tout le site, dans l'ordre :
//   1. sprite d'icônes    (tools/build-sprite.mjs)
//   2. pages de musique   (tools/build-albums.mjs, depuis contenus/albums.json)
//   2 bis. page vidéos    (tools/build-videos.mjs, depuis contenus/videos.json)
//   2 ter. concerts       (tools/build-concerts.mjs, depuis contenus/concerts.json)
//   2 quater. photos      (tools/build-photos.mjs, depuis contenus/photos.json)
//   3. blocs communs      (tools/build-pages.mjs, depuis partials/)
//   4. contrôles : symboles bannis (tools/check-symbols.mjs), liens (tools/check-links.mjs)
//
// Usage : node tools/build.mjs

import { execFileSync } from "node:child_process";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const tools = dirname(fileURLToPath(import.meta.url));
const steps = ["build-sprite.mjs", "build-albums.mjs", "build-videos.mjs", "build-concerts.mjs", "build-photos.mjs", "build-pages.mjs", "check-symbols.mjs", "check-links.mjs"];

for (const step of steps) {
  console.log(`\n> ${step}`);
  try {
    execFileSync(process.execPath, [join(tools, step)], { stdio: "inherit", cwd: resolve(tools, "..") });
  } catch {
    console.error(`\nÉchec à l'étape ${step}.`);
    process.exit(1);
  }
}
console.log("\nSite construit.");
