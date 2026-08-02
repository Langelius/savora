const test = require("node:test");
const assert = require("node:assert/strict");

process.env.MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/savora-test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "cle-de-test-suffisamment-longue-pour-les-tests";

const { echapperRegex, construireRecherche } = require("../src/utils/texte");
const { limiteurRequetes } = require("../src/middleware/securite");
const { validerCarte } = require("../src/services/paiement");

test("echapperRegex neutralise les métacaractères", () => {
  assert.equal(echapperRegex("pizza"), "pizza");
  assert.equal(echapperRegex("(a+)+$"), "\\(a\\+\\)\\+\\$");
  assert.equal(echapperRegex("a.b*c"), "a\\.b\\*c");
});

test("construireRecherche produit une expression littérale et non un motif", () => {
  const filtre = construireRecherche("a.b", ["nom"]);
  const motif = filtre.$or[0].nom;

  assert.ok(motif.test("a.b"));
  assert.ok(!motif.test("axb")); // « . » ne joue plus le rôle de joker
});

test("construireRecherche ignore une saisie vide", () => {
  assert.equal(construireRecherche("", ["nom"]), null);
  assert.equal(construireRecherche("   ", ["nom"]), null);
});

test("le limiteur bloque au-delà du maximum et renvoie 429", () => {
  const limiter = limiteurRequetes({ fenetreMs: 1000, maximum: 2, message: "trop" });

  let statut = null;
  const requete = { ip: "10.0.0.1", socket: {} };
  const reponse = {
    setHeader() {},
    status(code) {
      statut = code;
      return this;
    },
    json() {
      return this;
    },
  };

  let passages = 0;
  const suivant = () => {
    passages += 1;
  };

  limiter(requete, reponse, suivant);
  limiter(requete, reponse, suivant);
  limiter(requete, reponse, suivant);

  assert.equal(passages, 2);
  assert.equal(statut, 429);
});

test("validerCarte refuse les cartes mal formées ou expirées", () => {
  const valide = {
    titulaire: "Archange Guimdo",
    numero: "4242 4242 4242 4242",
    expiration: "12/34",
    cvv: "123",
  };

  assert.ok(validerCarte(valide).valide);
  assert.ok(!validerCarte({ ...valide, numero: "4242" }).valide);
  assert.ok(!validerCarte({ ...valide, cvv: "1" }).valide);
  assert.ok(!validerCarte({ ...valide, expiration: "13/34" }).valide);
  assert.ok(!validerCarte({ ...valide, expiration: "01/20" }).valide);
  assert.ok(!validerCarte({ ...valide, titulaire: "AB" }).valide);
});
