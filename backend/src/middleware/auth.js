// Middleware d'authentification par jeton JWT.
const jwt = require("jsonwebtoken");

const Utilisateur = require("../models/Utilisateur");
const { environnement } = require("../config/environnement");

// Vérifie le jeton, puis recharge l'utilisateur depuis la base.
//
// Le rôle n'est volontairement pas lu dans le jeton : un compte supprimé ou
// rétrogradé par un administrateur conserverait sinon ses droits pendant les
// 24 heures de validité du jeton.
async function verifierJeton(requete, reponse, suivant) {
  const entete = requete.headers.authorization;
  if (!entete || !entete.startsWith("Bearer ")) {
    return reponse.status(401).json({ message: "Jeton manquant" });
  }

  const jeton = entete.slice("Bearer ".length).trim();

  let charge;
  try {
    charge = jwt.verify(jeton, environnement.secretJwt);
  } catch (erreur) {
    const expire = erreur.name === "TokenExpiredError";
    return reponse.status(401).json({
      message: expire ? "Session expirée, reconnecte-toi" : "Jeton invalide",
    });
  }

  const utilisateur = await Utilisateur.findById(charge.id).select("role restaurantId nom");
  if (!utilisateur) {
    return reponse.status(401).json({ message: "Ce compte n'existe plus" });
  }

  requete.utilisateur = {
    id: String(utilisateur._id),
    nom: utilisateur.nom,
    role: utilisateur.role,
    restaurantId: utilisateur.restaurantId ? String(utilisateur.restaurantId) : null,
  };

  suivant();
}

module.exports = verifierJeton;
