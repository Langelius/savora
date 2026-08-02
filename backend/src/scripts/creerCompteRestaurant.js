// Rattachement d'un compte gestionnaire à un restaurant existant.
//
//   PowerShell :
//     $env:NOM_RESTAURANT="Nami Sushi"          # nom exact, voir GET /api/restaurants
//     $env:COURRIEL_RESTAURANT="gestion@exemple.ca"
//     $env:MOT_DE_PASSE_RESTAURANT="<mot de passe solide>"
//     npm run creer-compte-restaurant
//
// Depuis la version 3.1, un administrateur peut créer un établissement ET son
// gestionnaire directement dans l'application : Espace admin → Restaurants →
// « Nouveau restaurant ». Ce script reste utile pour la toute première
// installation, quand aucun compte administrateur n'existe encore.

const bcrypt = require("bcrypt");

const Utilisateur = require("../models/Utilisateur");
const Restaurant = require("../models/Restaurant");
const { echapperRegex } = require("../utils/texte");
const {
  ErreurScript,
  lireVariable,
  lireCourriel,
  lireMotDePasse,
  executerScript,
} = require("./commun");

const TOURS_BCRYPT = 12;

executerScript(async () => {
  const nomRestaurant = lireVariable("NOM_RESTAURANT");
  const courriel = lireCourriel("COURRIEL_RESTAURANT");
  const motDePasse = lireMotDePasse("MOT_DE_PASSE_RESTAURANT");
  const nom = lireVariable("NOM_RESTAURANT_COMPTE", {
    obligatoire: false,
    defaut: `Gestionnaire ${nomRestaurant}`,
  });

  // Recherche insensible à la casse, sur le nom exact.
  const restaurant = await Restaurant.findOne({
    nom: { $regex: `^${echapperRegex(nomRestaurant)}$`, $options: "i" },
  });

  if (!restaurant) {
    const disponibles = await Restaurant.find().select("nom").sort({ nom: 1 });
    const liste = disponibles.map((r) => `  - ${r.nom}`).join("\n");

    throw new ErreurScript(
      `Aucun restaurant nommé « ${nomRestaurant} ».\n` +
        (liste ? `Restaurants existants :\n${liste}` : "Aucun restaurant en base : lancer d'abord npm run seed.")
    );
  }

  const existant = await Utilisateur.findOne({ courriel });

  if (existant && existant.role !== "restaurant") {
    console.warn(
      `⚠  Le compte ${courriel} existe déjà avec le rôle « ${existant.role} ».\n` +
        "   Il va devenir gestionnaire et son mot de passe sera remplacé."
    );
  }

  const utilisateur = await Utilisateur.findOneAndUpdate(
    { courriel },
    {
      nom,
      courriel,
      motDePasse: await bcrypt.hash(motDePasse, TOURS_BCRYPT),
      role: "restaurant",
      restaurantId: restaurant._id,
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );

  console.log(`Compte gestionnaire prêt : ${utilisateur.courriel} → ${restaurant.nom}`);
});
