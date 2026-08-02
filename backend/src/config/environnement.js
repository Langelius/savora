// Configuration centralisée : toutes les variables d'environnement sont lues
// et validées ici, une seule fois, plutôt que dispersées dans le code.
require("dotenv").config();

// Taux de taxes du Québec (TPS 5 % + TVQ 9,975 %).
// Le taux vit côté serveur uniquement : l'application mobile le récupère
// par l'API afin d'éviter deux règles métier divergentes.
const TAUX_TAXES = 0.14975;

const DUREE_DE_VIE_JETON = "24h";
const DUREE_JETON_REINITIALISATION_MS = 60 * 60 * 1000; // 1 heure

function lireOriginesAutorisees() {
  const brut = String(process.env.ORIGINES_AUTORISEES || "").trim();
  if (!brut) return null; // null = toutes les origines (développement)

  const origines = [];
  for (const morceau of brut.split(",")) {
    const origine = morceau.trim();
    if (origine) origines.push(origine);
  }
  return origines;
}

const environnement = {
  port: Number(process.env.PORT) || 3000,
  uriMongo: process.env.MONGODB_URI,
  secretJwt: process.env.JWT_SECRET,
  modeProduction: process.env.NODE_ENV === "production",
  originesAutorisees: lireOriginesAutorisees(),
  cleStripe: String(process.env.STRIPE_SECRET_KEY || "").trim(),
  deviseStripe: String(process.env.STRIPE_DEVISE || "cad").toLowerCase(),
  TAUX_TAXES,
  DUREE_DE_VIE_JETON,
  DUREE_JETON_REINITIALISATION_MS,
};

// Vérifie au démarrage que rien d'essentiel ne manque : il vaut mieux
// un message clair tout de suite qu'une erreur obscure à la première requête.
function validerEnvironnement() {
  const erreurs = [];

  if (!environnement.uriMongo) {
    erreurs.push("MONGODB_URI manque dans le fichier .env");
  }
  if (!environnement.secretJwt || environnement.secretJwt.length < 32) {
    erreurs.push("JWT_SECRET doit contenir au moins 32 caractères");
  }
  if (environnement.modeProduction && !environnement.originesAutorisees) {
    erreurs.push("ORIGINES_AUTORISEES est obligatoire en production");
  }
  if (environnement.cleStripe && !environnement.cleStripe.startsWith("sk_test_")) {
    erreurs.push("STRIPE_SECRET_KEY doit être une clé de test (sk_test_...) : projet scolaire");
  }

  if (erreurs.length > 0) {
    throw new Error(`Configuration invalide :\n- ${erreurs.join("\n- ")}`);
  }
}

module.exports = { environnement, validerEnvironnement };
