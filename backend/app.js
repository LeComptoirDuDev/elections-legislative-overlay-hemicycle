const axios = require("axios").default;
const csv = require("csv-parser");
const JSDOM = require("jsdom").JSDOM;
const fs = require("fs");

const nuances = [];
const loadNuances = () => {
  return new Promise((resolve, reject) => {
    fs.createReadStream("data/nuances.csv")
      .pipe(csv())
      .on("data", (data) => {
        nuances.push({
          code: data.code,
          couleur: data.couleur,
        });
      })
      .on("end", () => {
        resolve();
      });
  });
};

const circonscriptions = [];
const loadCirconscriptions = () => {
  return new Promise((resolve, reject) => {
    fs.createReadStream("data/circonscriptions.csv")
      .pipe(csv())
      .on("data", (data) => {
        circonscriptions.push({
          department: String(data.department)
            .replace("ZZ", "99")
            .padStart(3, "0"),
          number: String(data.numero).padStart(2, "0"),
        });
      })
      .on("end", () => resolve());
  });
};

const startScraping = () => {
  console.log("start scraping");
  scrutation().then(() => {
    setTimeout(startScraping, 60 * 1000);
    const results = groupByNuance();
    console.log("output ok");
    fs.writeFileSync("data/groupedResults.json", JSON.stringify(results));
    fs.writeFileSync(
      "data/results.json",
      JSON.stringify(circonscriptions, null, 2)
    );
  });
};

const groupByNuance = () => {
  return nuances.map((nuance) => {
    return {
      code: nuance.code,
      couleur: nuance.couleur,
      sieges: circonscriptions.filter(
        (circonscription) => circonscription.premier === nuance.code
      ).length,
    };
  });
};

const scrutation = async () => {
  return new Promise(async (resolve, reject) => {
    for (let index = 0; index < circonscriptions.length; index++) {
      const circ = circonscriptions[index];
      try {
        circ.premier = await getDataForCirconscription(circ);
      } catch (e) {
        console.error({ circ, url });
      }
    }
    resolve();
  });
};

const getDataForCirconscription = async (circ) => {
  const url = `https://www.interieur.gouv.fr/Elections/Les-resultats/Legislatives/elecresult__legislatives-2017/(path)/legislatives-2017/${circ.department}/${circ.department}${circ.number}.html`;

  try {
    let page = await axios.get(url);
    const { document } = new JSDOM(page.data).window;
    const premier =
      document.querySelector("table>tbody>tr").children[1].innerHTML;
    return premier;
  } catch (e) {
    throw new Error(e);
  }
};

Promise.all([loadNuances(), loadCirconscriptions()]).then(() =>
  startScraping()
);

// console.log(circonscriptions);
