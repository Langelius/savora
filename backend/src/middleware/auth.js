// Middleware d'authentification par jeton JWT
const jwt = require("jsonwebtoken");

function verifierJeton(requete, reponse, suivant) {
  const entete = requete.headers.authorization;
  if (!entete || !entete.startsWith("Bearer ")) {
    return reponse.status(401).json({ message: "Jeton manquant" });
  }

  const jeton = entete.split(" ")[1];
  try {
    const donnees = jwt.verify(jeton, process.env.JWT_SECRET);
    requete.utilisateur = donnees;
    suivant();
  } catch (erreur) {
    return reponse.status(401).json({ message: "Jeton invalide" });
  }
}

module.exports = verifierJeton;
