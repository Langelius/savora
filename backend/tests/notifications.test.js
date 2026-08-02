const test = require("node:test");
const assert = require("node:assert/strict");

process.env.MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/savora-test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "cle-de-test-suffisamment-longue-pour-les-tests";

const { composerMessage, jetonValide } = require("../src/services/notifications");

test("seuls les jetons au format Expo sont acceptés", () => {
  assert.ok(jetonValide("ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"));
  assert.ok(jetonValide("ExpoPushToken[abc123]"));
  assert.ok(!jetonValide("jeton-bidon"));
  assert.ok(!jetonValide(""));
  assert.ok(!jetonValide(null));
});

test("chaque statut visible par le client produit un message", () => {
  const statuts = ["confirmée", "en préparation", "prête", "prise en charge", "en route", "livrée", "annulée"];

  for (const statut of statuts) {
    const message = composerMessage({ _id: "abc", statut, restaurantId: { nom: "Nami Sushi" } });
    assert.ok(message, `aucun message pour le statut « ${statut} »`);
    assert.ok(message.title.length > 0);
    assert.ok(message.body.length > 0);
    assert.equal(message.data.statut, statut);
  }
});

test("le statut initial ne déclenche pas de notification", () => {
  // Le client vient de passer commande : il n'a pas besoin qu'on l'en informe.
  assert.equal(composerMessage({ _id: "abc", statut: "en attente" }), null);
});

test("le message reste lisible quand le restaurant n'est pas peuplé", () => {
  const message = composerMessage({ _id: "abc", statut: "confirmée" });
  assert.ok(message.body.includes("Le restaurant"));
});

test("le nom du livreur apparaît une fois la commande prise en charge", () => {
  const message = composerMessage({
    _id: "abc",
    statut: "en route",
    livreurId: { nom: "Luc" },
  });
  assert.ok(message.body.includes("Luc"));
});
