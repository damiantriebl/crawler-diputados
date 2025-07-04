// bun run src/countFirmantes.ts
import { readFileSync, writeFileSync } from "fs";
import * as cheerio from "cheerio";
import pLimit from "p-limit";

type Dipu = { nombre: string; alias: string; partido: string };
const dipus: Dipu[] = JSON.parse(readFileSync("data/diputados.json", "utf8"));
const limit = pLimit(8); // 8 fetch paralelos

async function cuenta(alias: string): Promise<number> {
  const url = `https://www.diputados.gov.ar/diputados/${alias}/listado-proyectos.html?tipoFirmante=firmante`;
  const html = await fetch(url).then(r => r.text());
  const m = html.match(/(\d+)\s+Proyectos\s+Encontrados/);
  return m ? +m[1] : 0;
}

const stats = await Promise.all(dipus.map(d =>
  limit(() => cuenta(d.alias).then(n => ({ ...d, firmantes: n })))
));

writeFileSync("data/stats.json", JSON.stringify(stats, null, 2));
console.log("Stats OK 🚀");
// ejemplo div paginador :contentReference[oaicite:1]{index=1}
