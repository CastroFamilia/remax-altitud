const fs = require("fs");
const urls = fs.readFileSync("scratch/all-urls.txt", "utf8").split("\n");
let noMatchCount = 0;
urls.forEach(u => {
  const url = u.trim();
  if (!url || url.includes("youtube_url") || url.includes("rows)") || url.startsWith("-")) return;
  const match = url.match(/(?:v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/|youtube\.com\/v\/)([A-Za-z0-9_-]{11})/i);
  if (!match) {
    console.log("NO MATCH:", url);
    noMatchCount++;
  }
});
console.log("Total non-matching:", noMatchCount);
