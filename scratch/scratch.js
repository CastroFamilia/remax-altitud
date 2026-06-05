function parseDescription(text) {
  let cleaned = text;

  cleaned = cleaned.replace(/([.!?])([A-ZÑÁÉÍÓÚÜ])/g, "$1 $2");

  // Fix lowercase/number/parenthesis immediately followed by a Capital letter that has a colon shortly after (a label).
  cleaned = cleaned.replace(/([a-záéíóúñü0-9)])([A-ZÑÁÉÍÓÚÜ][a-záéíóúñü\sA-Z]{1,30}:)/g, (match, p1, p2) => {
      return p1 + '\n' + p2;
  });

  // Fix missing newline after a colon
  cleaned = cleaned.replace(/:([A-ZÑÁÉÍÓÚÜ])/g, ":\n$1");

  const majorHeaders = [
    "Descripción", "Description", "Location", "Features"
  ];

  const headingRegex = new RegExp(
    `([a-zñáéíóúüA-Z0-9.!?)]\\s*)(${majorHeaders.join("|")})\\b`,
    "g",
  );
  cleaned = cleaned.replace(headingRegex, "$1\n\n$2");

  console.log("CLEANED:");
  console.log(cleaned);
}

parseDescription("Rise above the horizon from the top of Alto de San Juan: a property where the Pacific breeze and mountain freshness converge in a stunning 360-degree setting.Description:Strategically located on the main road, this 22,652 m² (5.6-acre) farm offers maximum accessibility. Alto de San Juan, San Isidro, Pérez ZeledónLand Area: 22,652 m² (5.6 acres)Construction: 40 m² (unfinished structure)Access: Frontage on main road (accessible for all vehicles)Highlights: 360° panoramic views (ocean/mountain), 4 build-ready sites, private spring, and fruit trees. Technical");
