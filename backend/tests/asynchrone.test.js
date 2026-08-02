const test = require("node:test");
const assert = require("node:assert/strict");

const asynchrone = require("../src/utils/asynchrone");

test("asynchrone transmet une promesse rejetée au middleware d'erreurs", async () => {
  const controleurCasse = async () => {
    throw new Error("panne base de données");
  };

  let erreurRecue = null;
  const suivant = (erreur) => {
    erreurRecue = erreur;
  };

  await asynchrone(controleurCasse)({}, {}, suivant);

  assert.ok(erreurRecue instanceof Error);
  assert.equal(erreurRecue.message, "panne base de données");
});

test("asynchrone laisse passer un contrôleur qui réussit", async () => {
  let appele = false;
  const controleur = async () => {
    appele = true;
  };

  let erreurRecue = null;
  await asynchrone(controleur)({}, {}, (e) => {
    erreurRecue = e;
  });

  assert.ok(appele);
  assert.equal(erreurRecue, null);
});
