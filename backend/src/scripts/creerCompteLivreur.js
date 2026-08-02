// Création d'un compte livreur.
//
//   PowerShell :
//     $env:COURRIEL_LIVREUR="luc@exemple.ca"
//     $env:MOT_DE_PASSE_LIVREUR="<mot de passe solide>"
//     $env:NOM_LIVREUR="Luc Tremblay"
//     npm run creer-compte-livreur
//
// Un administrateur peut aussi promouvoir un compte client existant depuis
// l'application : Espace admin → Utilisateurs → changer le rôle.

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
  const courriel = lireCourriel("COURRIEL_LIVREUR");
  const motDePasse = lireMotDePasse("MOT_DE_PASSE_LIVREUR");
  const nom = lireVariable("NOM_LIVREUR", { obligatoire: false, defaut: "Livreur Savora" });
  const telephone = lireVariable("TELEPHONE_LIVREUR", { obligatoire: false });

  const existant = await Utilisateur.findOne({ courriel });

  if (existant && existant.role !== "livreur") {
    console.warn(
      `⚠  Le compte ${courriel} existe déjà avec le rôle « ${existant.role} ».\n` +
        "   Il va devenir livreur et son mot de passe sera remplacé."
    );
  }

  const utilisateur = await Utilisateur.findOneAndUpdate(
    { courriel },
    {
      nom,
      courriel,
      motDePasse: await bcrypt.hash(motDePasse, TOURS_BCRYPT),
      telephone,
      role: "livreur",
      restaurantId: null,
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );

  console.log(`Compte livreur prêt : ${utilisateur.courriel} → ${utilisateur.nom}`);
});
