const crypto = require("crypto");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const Utilisateur = require("../models/Utilisateur");
const { environnement } = require("../config/environnement");

// Coût du hachage bcrypt. 12 tours ≈ 250 ms sur une machine de bureau :
// négligeable pour un utilisateur, très coûteux pour une attaque par force brute.
const TOURS_BCRYPT = 12;

const FORMAT_COURRIEL = /^\S+@\S+\.\S+$/;
const LONGUEUR_MOT_DE_PASSE = 8;

function creerJeton(utilisateur) {
  return jwt.sign({ id: utilisateur._id }, environnement.secretJwt, {
    expiresIn: environnement.DUREE_DE_VIE_JETON,
  });
}

// Représentation publique d'un utilisateur : ni hachage, ni jeton interne.
function representerUtilisateur(utilisateur) {
  return {
    id: utilisateur._id,
    nom: utilisateur.nom,
    courriel: utilisateur.courriel,
    role: utilisateur.role,
    telephone: utilisateur.telephone,
    restaurantId: utilisateur.restaurantId,
  };
}

async function inscription(requete, reponse) {
  const nom = String(requete.body.nom || "").trim();
  const courriel = String(requete.body.courriel || "").trim().toLowerCase();
  const motDePasse = String(requete.body.motDePasse || "");

  if (nom.length < 2) {
    return reponse.status(400).json({ message: "Le nom doit contenir au moins 2 caractères" });
  }
  if (!FORMAT_COURRIEL.test(courriel)) {
    return reponse.status(400).json({ message: "Le courriel n'est pas valide" });
  }
  if (motDePasse.length < LONGUEUR_MOT_DE_PASSE) {
    return reponse.status(400).json({
      message: `Le mot de passe doit contenir au moins ${LONGUEUR_MOT_DE_PASSE} caractères`,
    });
  }

  if (await Utilisateur.exists({ courriel })) {
    return reponse.status(409).json({ message: "Courriel déjà utilisé" });
  }

  // Le rôle n'est jamais accepté depuis le corps de la requête : une
  // inscription publique crée toujours un compte client. Les comptes
  // restaurant, livreur et administrateur sont créés par les scripts
  // d'administration ou promus par un administrateur.
  const utilisateur = await Utilisateur.create({
    nom,
    courriel,
    motDePasse: await bcrypt.hash(motDePasse, TOURS_BCRYPT),
    role: "client",
  });

  reponse.status(201).json({
    token: creerJeton(utilisateur),
    utilisateur: representerUtilisateur(utilisateur),
  });
}

async function connexion(requete, reponse) {
  const courriel = String(requete.body.courriel || "").trim().toLowerCase();
  const motDePasse = String(requete.body.motDePasse || "");

  const utilisateur = await Utilisateur.findOne({ courriel }).select("+motDePasse");

  // Message volontairement identique dans les deux cas : il ne doit pas
  // permettre de deviner quels courriels sont enregistrés.
  const identifiantsInvalides = () =>
    reponse.status(401).json({ message: "Identifiants invalides" });

  if (!utilisateur) return identifiantsInvalides();

  const correspond = await bcrypt.compare(motDePasse, utilisateur.motDePasse);
  if (!correspond) return identifiantsInvalides();

  reponse.json({
    token: creerJeton(utilisateur),
    utilisateur: representerUtilisateur(utilisateur),
  });
}

async function obtenirProfil(requete, reponse) {
  const utilisateur = await Utilisateur.findById(requete.utilisateur.id);
  if (!utilisateur) return reponse.status(404).json({ message: "Utilisateur introuvable" });

  reponse.json({ utilisateur });
}

async function modifierProfil(requete, reponse) {
  // Liste blanche : « role » et « restaurantId » ne peuvent pas être modifiés
  // par l'utilisateur lui-même, sinon n'importe qui deviendrait administrateur.
  const champsModifiables = ["nom", "telephone", "adresses"];
  const champs = {};

  for (const champ of champsModifiables) {
    if (requete.body[champ] !== undefined) champs[champ] = requete.body[champ];
  }

  if (requete.body.courriel) {
    const courriel = String(requete.body.courriel).trim().toLowerCase();
    if (!FORMAT_COURRIEL.test(courriel)) {
      return reponse.status(400).json({ message: "Le courriel n'est pas valide" });
    }
    const dejaPris = await Utilisateur.exists({
      courriel,
      _id: { $ne: requete.utilisateur.id },
    });
    if (dejaPris) return reponse.status(409).json({ message: "Courriel déjà utilisé" });
    champs.courriel = courriel;
  }

  if (Object.keys(champs).length === 0) {
    return reponse.status(400).json({ message: "Aucun champ à modifier" });
  }

  const utilisateur = await Utilisateur.findByIdAndUpdate(requete.utilisateur.id, champs, {
    new: true,
    runValidators: true,
  });

  reponse.json({ utilisateur });
}

async function motDePasseOublie(requete, reponse) {
  const courriel = String(requete.body.courriel || "").trim().toLowerCase();

  // Réponse identique que le compte existe ou non : sinon la route devient
  // un moyen de vérifier quelles adresses sont inscrites.
  const message = "Si ce courriel est enregistré, un lien de réinitialisation a été envoyé";

  const utilisateur = await Utilisateur.findOne({ courriel }).select(
    "+jetonReinitialisation +expirationJetonReinitialisation"
  );
  if (!utilisateur) return reponse.json({ message });

  const jeton = crypto.randomBytes(32).toString("hex");

  // Seule l'empreinte est stockée : une fuite de la base ne permet pas de
  // réutiliser les jetons en attente.
  utilisateur.jetonReinitialisation = crypto.createHash("sha256").update(jeton).digest("hex");
  utilisateur.expirationJetonReinitialisation = new Date(
    Date.now() + environnement.DUREE_JETON_REINITIALISATION_MS
  );
  await utilisateur.save();

  // Aucun service d'envoi de courriel n'est branché dans ce projet scolaire.
  // Le jeton n'est renvoyé qu'en développement ; en production il devrait
  // partir par courriel et ne jamais apparaître dans la réponse HTTP.
  if (environnement.modeProduction) {
    return reponse.json({ message });
  }

  reponse.json({
    message,
    jeton,
    note: "Jeton exposé uniquement en développement, faute de service de courriel.",
  });
}

async function reinitialiserMotDePasse(requete, reponse) {
  const nouveauMotDePasse = String(requete.body.nouveauMotDePasse || "");
  const jetonHache = crypto
    .createHash("sha256")
    .update(String(requete.body.jeton || ""))
    .digest("hex");

  const utilisateur = await Utilisateur.findOne({
    courriel: String(requete.body.courriel || "").trim().toLowerCase(),
    jetonReinitialisation: jetonHache,
    expirationJetonReinitialisation: { $gt: new Date() },
  }).select("+motDePasse +jetonReinitialisation +expirationJetonReinitialisation");

  if (!utilisateur || nouveauMotDePasse.length < LONGUEUR_MOT_DE_PASSE) {
    return reponse.status(400).json({
      message: "Jeton invalide, expiré ou mot de passe trop court",
    });
  }

  utilisateur.motDePasse = await bcrypt.hash(nouveauMotDePasse, TOURS_BCRYPT);
  utilisateur.jetonReinitialisation = undefined;
  utilisateur.expirationJetonReinitialisation = undefined;
  await utilisateur.save();

  reponse.json({ message: "Mot de passe réinitialisé" });
}

module.exports = {
  inscription,
  connexion,
  obtenirProfil,
  modifierProfil,
  motDePasseOublie,
  reinitialiserMotDePasse,
  representerUtilisateur,
};
