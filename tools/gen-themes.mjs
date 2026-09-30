// Regenerates assets/css/themes.css from the apps' shared theme file, so the
// website uses exactly the same 13 palettes as the Rust apps.
//
//   node tools/gen-themes.mjs [path/to/theme.rs]
//
// Default source: ../zenless-download-manager/src/shared/theme.rs (sibling checkout).
// Not part of the deployment (see .vercelignore); the site has no build step.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const src = process.argv[2] || join(repo, "..", "zenless-download-manager", "src", "shared", "theme.rs");
const out = join(repo, "assets", "css", "themes.css");

// Same order as the palette arrays in builtin_themes().
const fields = [
  "bg", "surface", "surface2", "input", "stripe", "border", "text", "dim",
  "accent", "accent-fg", "accent2", "success", "warning", "danger", "info",
];

const rust = readFileSync(src, "utf8");
const themes = [];
for (const m of rust.matchAll(/theme\("([^"]+)",\s*(true|false),\s*\[([^\]]+)\]\)/g)) {
  const hex = m[3].split(",").map((s) => "#" + s.trim().replace(/^0x/, "").padStart(6, "0"));
  if (hex.length !== fields.length) throw new Error(`bad palette for ${m[1]}`);
  const id = m[1]
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  themes.push({ name: m[1], id, dark: m[2] === "true", hex });
}
if (themes.length === 0) throw new Error(`no themes found in ${src}`);

let css = `/* Zenless theme palettes.
 * GENERATED from zenless-download-manager/src/shared/theme.rs (builtin_themes()).
 * Same 15 colors, same order as the apps. Do not hand-edit; regenerate instead.
 * Any element can carry data-theme="<id>" to scope a palette (used by the swatches). */
`;
themes.forEach((t, i) => {
  const sel = i === 0 ? `:root,\n[data-theme="${t.id}"]` : `[data-theme="${t.id}"]`;
  css += `\n/* ${t.name} */\n${sel} {\n`;
  t.hex.forEach((h, j) => (css += `  --${fields[j]}: ${h};\n`));
  css += `  color-scheme: ${t.dark ? "dark" : "light"};\n}\n`;
});
writeFileSync(out, css);

console.log(`Wrote ${themes.length} themes to ${out}`);
console.log("If names or order changed, update the list in assets/js/theme-init.js too:");
console.log(themes.map((t) => `  ["${t.id}", "${t.name}"]`).join(",\n"));
