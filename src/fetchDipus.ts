// bun run src/fetchDipus.ts
import { writeFileSync } from "fs";
import * as cheerio from "cheerio";

const URL = "https://www.diputados.gov.ar/diputados/";

const html = await fetch(URL, {
  headers: { "user-agent": "Mozilla/5.0 bun-scraper" }
}).then(r => r.text());

const $ = cheerio.load(html);
const dipus: { nombre: string; alias: string; partido: string }[] = [];

$("table tbody tr").each((_, tr) => {
  const a = $(tr).find('a[href*="/diputados/"]').first();
  const nombre = a.text().trim();

  /* ── extraer alias con regex ─────────────────────────── */
  const href = a.attr("href") ?? "";
  const alias = (href.match(/\/diputados\/([^/]+)/)?.[1] ?? "").trim();

  const partido = $(tr).find("td").last().text().trim();

  if (alias) dipus.push({ nombre, alias, partido }); // descarta vacíos
});

writeFileSync("data/diputados.json", JSON.stringify(dipus, null, 2));
console.log(`📝 Guardé ${dipus.length} diputados con alias válido`);
