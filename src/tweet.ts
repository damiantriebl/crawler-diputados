// bun run src/tweet.ts
import { readFileSync } from "fs";
import { TwitterApi } from "twitter-api-v2";

type S = { nombre: string; partido: string; firmantes: number };

// Validar que existan las variables de entorno
const requiredEnvVars = ['X_KEY', 'X_SECRET', 'X_ACCESS_TOKEN', 'X_ACCESS_SECRET'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error(`❌ Faltan las siguientes variables de entorno: ${missingVars.join(', ')}`);
  console.error('Crea un archivo .env con:');
  console.error('X_KEY=tu_api_key');
  console.error('X_SECRET=tu_api_secret');
  console.error('X_ACCESS_TOKEN=tu_access_token');
  console.error('X_ACCESS_SECRET=tu_access_secret');
  process.exit(1);
}

// Leer datos
let stats: S[];
try {
  stats = JSON.parse(readFileSync("data/stats.json", "utf8"));
  console.log(`📊 Cargados ${stats.length} diputados`);
} catch (error) {
  console.error('❌ Error al leer data/stats.json:', error);
  process.exit(1);
}

// Inicializar Twitter API
const X = new TwitterApi({
  appKey: process.env.X_KEY!,
  appSecret: process.env.X_SECRET!,
  accessToken: process.env.X_ACCESS_TOKEN!,
  accessSecret: process.env.X_ACCESS_SECRET!,
});

const bloques = {
  ALL: "📉 TOP 5 vagos del Congreso",
  "UNIÓN POR LA PATRIA": "🔵 TOP 5 vagos UxP",
  PRO: "🟡 TOP 5 vagos PRO",
  UCR: "🔴 TOP 5 vagos UCR",
  "LA LIBERTAD AVANZA": "🟣 TOP 5 vagos LLA",
};

function top(arr: S[]) {
  return arr.sort((a, b) => a.firmantes - b.firmantes).slice(0, 5);
}

function body(title: string, lista: S[]) {
  return `${title}\n\n${lista
    .map((d, i) => `${i + 1}. ${d.nombre} – ${d.firmantes}`)
    .join("\n")}\n\nFuente hcdn.gob.ar`;
}

try {
  // Tweet general
  const tweetGeneral = await X.v2.tweet(body(bloques.ALL, top([...stats])));
  console.log('✅ Tweet general enviado');
  
  // Tweets por bloque
  for (const [bloque, title] of Object.entries(bloques).slice(1)) {
    const deputadosBloque = stats.filter(s => s.partido.includes(bloque));
    if (deputadosBloque.length > 0) {
      await X.v2.tweet(body(title, top(deputadosBloque)));
      console.log(`✅ Tweet ${bloque} enviado`);
      // Esperar un poco entre tweets para evitar rate limit
      await new Promise(resolve => setTimeout(resolve, 2000));
    } else {
      console.log(`⚠️ No se encontraron diputados para el bloque: ${bloque}`);
    }
  }
  
  console.log("🐦 Todos los tweets enviados correctamente");
  
} catch (error) {
  console.error('❌ Error al enviar tweets:', error);
  process.exit(1);
}
