const test = require("node:test");
const assert = require("node:assert/strict");

process.env.MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/savora-test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "cle-de-test-suffisamment-longue-pour-les-tests";

const {
  arrondirMontant,
  calculerPrixLigne,
  calculerTotaux,
} = require("../src/services/tarification");

test("arrondirMontant corrige les imprécisions des flottants", () => {
  assert.equal(arrondirMontant(0.1 + 0.2), 0.3);
  assert.equal(arrondirMontant(18.555), 18.56);
  assert.equal(arrondirMontant(7), 7);
});

test("calculerPrixLigne ajoute uniquement les options réellement choisies", () => {
  const plat = {
    prix: 18.5,
    options: [
      { nom: "Bacon", prix: 3 },
      { nom: "Double galette", prix: 6 },
      { nom: "Sans oignons", prix: 0 },
    ],
  };

  assert.equal(calculerPrixLigne(plat, []), 18.5);
  assert.equal(calculerPrixLigne(plat, ["Bacon"]), 21.5);
  assert.equal(calculerPrixLigne(plat, ["Bacon", "Double galette"]), 27.5);
  // Une option inconnue envoyée par un client malveillant est ignorée.
  assert.equal(calculerPrixLigne(plat, ["Option inventée"]), 18.5);
});

test("calculerTotaux applique les taxes du Québec sur le sous-total seulement", () => {
  const lignes = [
    { prix: 20, quantite: 2 },
    { prix: 7, quantite: 1 },
  ];

  const totaux = calculerTotaux(lignes, 2.49);

  assert.equal(totaux.sousTotal, 47);
  assert.equal(totaux.fraisLivraison, 2.49);
  assert.equal(totaux.taxes, 7.04); // 47 × 0,14975
  assert.equal(totaux.total, 56.53);
});

test("calculerTotaux gère un panier vide sans produire NaN", () => {
  const totaux = calculerTotaux([], 0);
  assert.deepEqual(totaux, { sousTotal: 0, fraisLivraison: 0, taxes: 0, total: 0 });
});
