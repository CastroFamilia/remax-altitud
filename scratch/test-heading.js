const majorHeaders = [
  "Descripción",
  "Description",
  "Technical Features",
  "Características Técnicas",
  "Exclusive Benefits",
  "Beneficios Exclusivos",
  "Features",
];

const headingRegex = new RegExp(
  `([a-zñáéíóúüA-Z0-9.!?)]\\s*)(${majorHeaders.join("|")})\\b`,
  "gi"
);

let text = "region. Technical Features: Location: Alto de San Juan";

let cleaned = text.replace(headingRegex, "$1\n\n$2");
console.log(cleaned);
