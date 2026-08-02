// Création d'un compte administrateur.
//
//   PowerShell :
//     $env:COURRIEL_ADMIN="prenom.nom@exemple.ca"
//     $env:MOT_DE_PASSE_ADMIN="<mot de passe solide>"
//     npm run creer-admin
//
//   bash :
//     COURRIEL_ADMIN=... MOT_DE_PASSE_ADMIN=... npm run creer-admin
//
// Aucun identifiant par défaut : ce script ne doit jamais pouvoir créer un
// compte administrateur dont le mot de passe figure dans le dépôt.

const bcrypt = require("bcrypt");

const Utilisateur = require("../models/Utilisateur");
const {
  lireVariable,
  lireCourriel,
  lireMotDePasse,
  executerScript,
} = require("./commun");

const TOURS_BCRYPT = 12;

executerScript(async () => {
  const courriel = lireCourriel("COURRIEL_ADMIN");
  const motDePasse = lireMotDePasse("MOT_DE_PASSE_ADMIN");
  const nom = lireVariable("NOM_ADMIN", { obligatoire: false, defaut: "Administrateur Savora" });

  const existant = await Utilisateur.findOne({ courriel });

  // Promouvoir un compte existant écrase son mot de passe. L'utilisateur doit
  // le savoir : auparavant, le script le faisait silencieusement.
  if (existant && existant.role !== "admin") {
    console.warn(
      `⚠  Le compte ${courriel} existe déjà avec le rôle « ${existant.role} ».\n` +
        "   Il va être promu administrateur et son mot de passe remplacé."
    );
  }

  const motDePasseHache = await bcrypt.hash(motDePasse, TOURS_BCRYPT);

  const utilisateur = await Utilisateur.findOneAndUpdate(
    { courriel },
    {
      nom,
      courriel,
      motDePasse: motDePasseHache,
      role: "admin",
      restaurantId: null,
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );

  console.log(
    existant
      ? `Compte administrateur mis à jour : ${utilisateur.courriel}`
      : `Compte administrateur créé : ${utilisateur.courriel}`
  );

  // Le mot de passe n'est volontairement pas réaffiché : il resterait dans
  // l'historique du terminal et dans les journaux de la plateforme d'hébergement.
  console.log("Mot de passe : celui fourni dans MOT_DE_PASSE_ADMIN.");
});
