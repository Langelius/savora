const test = require("node:test");
const assert = require("node:assert/strict");

process.env.MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/savora-test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "cle-de-test-suffisamment-longue-pour-les-tests";

const { lireChampsRestaurant, lireChampsPlat } = require("../src/services/validationMenu");

const restaurantValide = {
  nom: "Chez Test",
  cuisine: "Cuisine d'essai",
  image: "https://exemple.ca/photo.jpg",
  fraisLivraison: 2.5,
};

test("un restaurant valide est accepté et normalisé", () => {
  const champs = lireChampsRestaurant({ ...restaurantValide, nom: "  Chez Test  " }, { creation: true });
  assert.equal(champs.nom, "Chez Test");
  assert.equal(champs.fraisLivraison, 2.5);
});

test("la note d'un restaurant ne peut pas être imposée", () => {
  const champs = lireChampsRestaurant({ ...restaurantValide, note: 5, nombreAvis: 999 }, { creation: true });
  assert.equal(champs.note, undefined);
  assert.equal(champs.nombreAvis, undefined);
});

test("une image qui n'est pas une URL est refusée", () => {
  assert.throws(
    () => lireChampsRestaurant({ ...restaurantValide, image: "photo.jpg" }, { creation: true }),
    /URL/
  );
});

test("des frais de livraison hors bornes sont refusés", () => {
  assert.throws(
    () => lireChampsRestaurant({ ...restaurantValide, fraisLivraison: -3 }, { creation: true }),
    /frais/i
  );
  assert.throws(
    () => lireChampsRestaurant({ ...restaurantValide, fraisLivraison: 900 }, { creation: true }),
    /frais/i
  );
});

test("une modification partielle n'exige pas tous les champs", () => {
  const champs = lireChampsRestaurant({ description: "Nouvelle description" }, { creation: false });
  assert.deepEqual(champs, { description: "Nouvelle description" });
});

const platValide = {
  nom: "Burger test",
  categorie: "Burgers",
  image: "https://exemple.ca/burger.jpg",
  prix: 18.5,
};

test("un plat valide est accepté", () => {
  const champs = lireChampsPlat(platValide, { creation: true });
  assert.equal(champs.prix, 18.5);
  assert.equal(champs.nom, "Burger test");
});

test("un prix nul ou négatif est refusé", () => {
  assert.throws(() => lireChampsPlat({ ...platValide, prix: 0 }, { creation: true }), /prix/i);
  assert.throws(() => lireChampsPlat({ ...platValide, prix: -5 }, { creation: true }), /prix/i);
});

test("les options sont normalisées et les doublons refusés", () => {
  const champs = lireChampsPlat(
    { ...platValide, options: [{ nom: " Bacon ", prix: "3" }, { nom: "Sans oignons" }] },
    { creation: true }
  );

  assert.deepEqual(champs.options, [
    { nom: "Bacon", prix: 3 },
    { nom: "Sans oignons", prix: 0 },
  ]);

  assert.throws(
    () =>
      lireChampsPlat(
        { ...platValide, options: [{ nom: "Bacon", prix: 3 }, { nom: "Bacon", prix: 4 }] },
        { creation: true }
      ),
    /double/i
  );
});

test("un supplément négatif est refusé", () => {
  assert.throws(
    () => lireChampsPlat({ ...platValide, options: [{ nom: "Remise", prix: -2 }] }, { creation: true }),
    /invalide/i
  );
});
