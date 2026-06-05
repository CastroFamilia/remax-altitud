const fs = require('fs');

const data = {
  // Ojochal Parent
  "puerto-cortes": [
    "Puerto Cortés", "Puerto Cortes", "Canadá", "Cementerio", "Cinco Esquinas", "Montreal", "Precario", "Pueblo Nuevo", "Renacimiento", "Yuca",
    "Balsar", "Bocabrava", "Bocachica", "Cerrón", "Coronado", "Chontales", "Delicias", "Embarcadero", "Fuente", "Isla Sorpresa", "Lindavista", "Lourdes", "Ojochal", "Ojo de Agua", "Parcelas", "Pozo", "Punta Mala", "Punta Mala Arriba", "San Buenaventura", "San Juan", "San Marcos", "Tagual", "Tortuga Abajo", "Tres Ríos", "Vista de Térraba"
  ],
  "palmar": [
    "Palmar", "Palmar Norte", "Palmar Sur", "Betania", "Once de Abril", "Las Brisas", "La luz del mundo",
    "Alemania", "Alto Ángeles", "Alto Encanto", "Alto Montura", "Bellavista", "Calavera", "Cansot", "Cañablancal", "Coobó", "Progreso", "Coquito", "Gorrión", "Jalaca", "Olla Cero", "Palma", "Paraíso", "Primero de Marzo", "Puerta del Sol", "San Cristóbal", "San Francisco", "Tinoco", "San Gabriel", "San Isidro", "San Rafael", "Santa Elena", "Silencio", "Trocha", "Vergel", "Victoria", "Zapote"
  ],
  "sierpe": [
    "Sierpe", "Ajuntaderas", "Alto Los Mogos", "Alto San Juan", "Bahía Chal", "Bajos Matías", "Barco", "Bejuco", "Boca Chocuaco", "Gallega", "Camíbar", "Campo de Aguabuena", "Cantarrana", "Charcos", "Chocuaco", "Garrobo", "Guabos", "Isidora", "Islotes", "Jalaca", "Julia", "Miramar", "Mogos", "Monterrey", "Playa Palma", "Playitas", "Potrero", "Puerto Escondido", "Rincón", "Sábalo", "San Gerardo", "San Juan", "Taboga", "Taboguita", "Tigre", "Varillal"
  ],
  "piedras-blancas": [
    "Piedras Blancas", "Ángeles", "Bellavista", "Calera", "Cerro Oscuro", "Chacarita", "Fila", "Finca Alajuela", "Finca Guanacaste", "Finca Puntarenas", "Florida", "Guaria", "Kilómetro 40", "Navidad", "Nubes", "Porvenir", "Rincón Caliente", "Salamá", "San Martín", "Santa Cecilia", "Santa Rosa", "Sinaí", "Venecia", "Villa Bonita", "Villa Colón"
  ],
  "bahia-drake": [
    "Bahía Drake", "Bahia Drake", "Drake", "Villa Agujitas", "Ángeles", "Banegas", "Boca Ganado", "Campanario", "Caletas", "Guerra", "Planes", "Progreso", "Quebrada Ganado", "Rancho Quemado", "Riyito", "San Josecito", "San Pedrillo"
  ],
  
  // Dominical Parent
  "bahia-ballena": [
    "Bahía Ballena", "Bahia Ballena", "Uvita", "Cambutal", "Dominical", "Dominicalito", "Escaleras", "Piñuela", "Playa Hermosa", "Quebrada Grande", "San Josecito", "San Martín", "Tortuga Arriba"
  ]
};

const PARENTS = {
  "puerto-cortes": "ojochal",
  "palmar": "ojochal",
  "sierpe": "ojochal",
  "piedras-blancas": "ojochal",
  "bahia-drake": "ojochal",
  "bahia-ballena": "dominical"
};

// We group by parent area since they are checked independently.
// Wait, the API might assign `parent` automatically? No, `resolveSubLocation` only matches if `parent === areaSlug`.
// So we need to ensure uniqueness within the SAME parent.
const countsByParent = {
  "ojochal": {},
  "dominical": {}
};

for (const slug in data) {
  const parent = PARENTS[slug];
  for (const name of data[slug]) {
    const key = name.toLowerCase().trim();
    if (!countsByParent[parent][key]) countsByParent[parent][key] = [];
    if (!countsByParent[parent][key].includes(slug)) countsByParent[parent][key].push(slug);
  }
}

let finalMappingOjochal = [];
let finalMappingDominical = [];

for (const slug in data) {
  const parent = PARENTS[slug];
  for (const name of data[slug]) {
    const key = name.toLowerCase().trim();
    if (countsByParent[parent][key].length === 1 || key === slug || slug.replace("-", " ") === key || slug.replace("-", "") === key) {
      if (parent === "ojochal") {
        finalMappingOjochal.push({ keyword: key, slug, parent, original: name });
      } else {
        finalMappingDominical.push({ keyword: key, slug, parent, original: name });
      }
    } else {
      console.log(`Skipping ambiguous in ${parent}: ${name} (used in ${countsByParent[parent][key].join(", ")})`);
    }
  }
}

// Deduplicate mappings just in case
finalMappingOjochal = finalMappingOjochal.filter((v,i,a)=>a.findIndex(t=>(t.keyword === v.keyword))===i);
finalMappingDominical = finalMappingDominical.filter((v,i,a)=>a.findIndex(t=>(t.keyword === v.keyword))===i);

finalMappingOjochal.sort((a, b) => b.keyword.length - a.keyword.length);
finalMappingDominical.sort((a, b) => b.keyword.length - a.keyword.length);

const ojochalLines = finalMappingOjochal.map(f => `  { keyword: "${f.keyword}", slug: "${f.slug}", parent: "${f.parent}" }, // ${f.original || f.keyword}`);
const dominicalLines = finalMappingDominical.map(f => `  { keyword: "${f.keyword}", slug: "${f.slug}", parent: "${f.parent}" }, // ${f.original || f.keyword}`);

const filePath = 'src/lib/locations.ts';
let content = fs.readFileSync(filePath, 'utf8');

// The file currently has:
// // Osa
// { keyword: "bahía ballena", ... }
// ...
// // Quepos

const osaTag = '// Osa';
const queposTag = '// Quepos';

const osaIdx = content.indexOf(osaTag);
const queposIdx = content.indexOf(queposTag);

if (osaIdx !== -1 && queposIdx !== -1) {
  const before = content.slice(0, osaIdx + osaTag.length + 1);
  const after = content.slice(queposIdx);
  const newContent = before + dominicalLines.join('\n') + '\n' + ojochalLines.join('\n') + '\n  ' + after;
  fs.writeFileSync(filePath, newContent);
  console.log("Updated locations.ts successfully.");
} else {
  console.log("Could not find insertion points.");
}
