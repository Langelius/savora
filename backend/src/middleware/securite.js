// Middlewares de sécurité HTTP, sans dépendance externe.

const { environnement } = require("../config/environnement");

// En-têtes de sécurité de base (équivalent minimal de helmet).
function entetesSecurite(_requete, reponse, suivant) {
  reponse.setHeader("X-Content-Type-Options", "nosniff");
  reponse.setHeader("X-Frame-Options", "DENY");
  reponse.setHeader("Referrer-Policy", "no-referrer");
  reponse.setHeader("Cross-Origin-Resource-Policy", "same-site");
  reponse.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");

  if (environnement.modeProduction) {
    reponse.setHeader("Strict-Transport-Security", "max-age=15552000; includeSubDomains");
  }

  suivant();
}

// Limiteur de débit en mémoire (fenêtre glissante simplifiée).
//
// Objectif : empêcher l'essai automatisé de milliers de mots de passe sur
// /auth/connexion. Une mémoire de processus suffit pour un projet scolaire ;
// une vraie mise en production utiliserait Redis pour partager le compteur
// entre plusieurs instances du serveur.
function limiteurRequetes({ fenetreMs, maximum, message }) {
  const compteurs = new Map();

  // Nettoyage périodique pour éviter que la Map grossisse indéfiniment.
  const nettoyage = setInterval(() => {
    const maintenant = Date.now();
    for (const [cle, entree] of compteurs) {
      if (entree.expiration <= maintenant) compteurs.delete(cle);
    }
  }, fenetreMs);
  if (typeof nettoyage.unref === "function") nettoyage.unref();

  return function limiter(requete, reponse, suivant) {
    const cle = requete.ip || requete.socket.remoteAddress || "inconnu";
    const maintenant = Date.now();
    const entree = compteurs.get(cle);

    if (!entree || entree.expiration <= maintenant) {
      compteurs.set(cle, { nombre: 1, expiration: maintenant + fenetreMs });
      return suivant();
    }

    entree.nombre += 1;

    if (entree.nombre > maximum) {
      const secondes = Math.ceil((entree.expiration - maintenant) / 1000);
      reponse.setHeader("Retry-After", String(secondes));
      return reponse.status(429).json({ message, reessayerDansSecondes: secondes });
    }

    return suivant();
  };
}

// Politique CORS : ouverte en développement, restreinte par liste blanche
// dès qu'ORIGINES_AUTORISEES est renseignée.
function politiqueCors() {
  const autorisees = environnement.originesAutorisees;

  return {
    credentials: true,
    origin(origine, rappel) {
      if (!autorisees) return rappel(null, true);
      if (!origine) return rappel(null, true); // applications mobiles natives
      if (autorisees.includes(origine)) return rappel(null, true);
      return rappel(new Error(`Origine non autorisée : ${origine}`));
    },
  };
}

module.exports = { entetesSecurite, limiteurRequetes, politiqueCors };
