const notifications = require("../services/notifications");

// POST /api/notifications/appareil
// L'application envoie son jeton Expo après acceptation de l'utilisateur.
async function enregistrerAppareil(requete, reponse) {
  const appareil = await notifications.enregistrerAppareil(
    requete.utilisateur.id,
    requete.body.jeton,
    requete.body.plateforme
  );

  reponse.status(201).json({
    message: "Appareil enregistré",
    appareil: { id: appareil._id, plateforme: appareil.plateforme },
  });
}

// DELETE /api/notifications/appareil
// Appelée à la déconnexion : l'appareil ne doit plus recevoir les
// notifications d'un compte auquel il n'est plus connecté.
async function oublierAppareil(requete, reponse) {
  await notifications.oublierAppareil(requete.body.jeton);
  reponse.json({ message: "Appareil retiré" });
}

module.exports = { enregistrerAppareil, oublierAppareil };
