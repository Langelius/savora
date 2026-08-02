const test = require("node:test");
const assert = require("node:assert/strict");

const {
  estStatutConnu,
  transitionAutorisee,
  roleAutorise,
} = require("../src/services/statutsCommande");

test("les statuts inconnus sont rejetés", () => {
  assert.ok(estStatutConnu("en préparation"));
  assert.ok(!estStatutConnu("EN PRÉPARATION"));
  assert.ok(!estStatutConnu("terminée"));
});

test("le cycle de vie normal d'une commande est autorisé de bout en bout", () => {
  const parcours = [
    "en attente",
    "confirmée",
    "en préparation",
    "prête",
    "prise en charge",
    "en route",
    "livrée",
  ];

  for (let i = 0; i < parcours.length - 1; i += 1) {
    assert.ok(
      transitionAutorisee(parcours[i], parcours[i + 1]),
      `${parcours[i]} → ${parcours[i + 1]} devrait être autorisé`
    );
  }
});

test("on ne peut ni sauter une étape ni repartir d'un état final", () => {
  assert.ok(!transitionAutorisee("en attente", "livrée"));
  assert.ok(!transitionAutorisee("en préparation", "en route"));
  assert.ok(!transitionAutorisee("livrée", "en route"));
  assert.ok(!transitionAutorisee("annulée", "confirmée"));
});

test("une commande ne peut plus être annulée une fois prête", () => {
  assert.ok(transitionAutorisee("en préparation", "annulée"));
  assert.ok(!transitionAutorisee("prête", "annulée"));
});

test("chaque rôle ne pose que les statuts qui le concernent", () => {
  assert.ok(roleAutorise("restaurant", "en préparation"));
  assert.ok(!roleAutorise("restaurant", "livrée"));

  assert.ok(roleAutorise("livreur", "en route"));
  assert.ok(!roleAutorise("livreur", "confirmée"));

  assert.ok(!roleAutorise("client", "livrée"));
  assert.ok(roleAutorise("admin", "annulée"));
});
