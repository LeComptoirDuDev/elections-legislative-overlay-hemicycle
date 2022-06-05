const svg = document.getElementById("hemicycle");
const decoder = new TextDecoder("utf-8");

(async () => {
  const nuances = await fetch("/data/groupedResults.json")
    .then((response) => {
      return response.arrayBuffer();
    })
    .then((buffer) => decoder.decode(buffer))
    .then(JSON.parse);
  const step = 255 / nuances.length;
  const circles = svg.querySelectorAll("g>circle");
  let index = 0;
  for (const nuance of nuances) {
    for (let i = 0; i < nuance.sieges; i++) {
      circles[index + i].setAttribute("style", `fill:${nuance.couleur}`);
    }
    index += nuance.sieges;
  }
})();
