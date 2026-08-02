const { environnement } = require("../config/environnement");

function routeIntrouvable(requete, reponse) {
  reponse.status(404).json({
    message: `Route introuvable : ${requete.method} ${requete.originalUrl}`,
  });
}

// Gestionnaire d'erreurs unique de l'application.
// Express le reconnaît à ses quatre paramètres : ne pas retirer « suivant ».
function gererErreurs(erreur, _requete, reponse, _suivant) {
  if (erreur.name === "CastError") {
    return reponse.status(400).json({ message: "Identifiant invalide" });
  }

  if (erreur.name === "ValidationError") {
    const messages = [];
    for (const detail of Object.values(erreur.errors)) {
      messages.push(detail.message);
    }
    return reponse.status(400).json({ message: messages.join(", ") });
  }

  // Violation d'un index unique (courriel déjà pris, avis déjà déposé...).
  if (erreur.code === 11000) {
    return reponse.status(409).json({ message: "Cet enregistrement existe déjà" });
  }

  const statut = erreur.status || 500;

  // Seules les vraies erreurs serveur méritent une trace complète.
  if (statut >= 500) {
    console.error("Erreur non gérée :", erreur);
  }

  reponse.status(statut).json({
    message:
      environnement.modeProduction && statut >= 500
        ? "Erreur interne du serveur"
        : erreur.message,
  });
}

module.exports = { routeIntrouvable, gererErreurs };
