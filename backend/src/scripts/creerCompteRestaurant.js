require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const connecter = require("../config/db");
const Utilisateur = require("../models/Utilisateur");
const Restaurant = require("../models/Restaurant");

function echapperRegex(valeur) {
  return valeur.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

(async () => {
  const nom =
    process.env.NOM_RESTAURANT_COMPTE || "Gestionnaire restaurant";

  const nomRestaurant = String(
    process.env.NOM_RESTAURANT || ""
  ).trim();

  const courriel = String(
    process.env.COURRIEL_RESTAURANT || ""
  )
    .trim()
    .toLowerCase();

  const motDePasse = String(
    process.env.MOT_DE_PASSE_RESTAURANT || ""
  );

  if (!nomRestaurant || !courriel || motDePasse.length < 8) {
    throw new Error(
      "Définis NOM_RESTAURANT, COURRIEL_RESTAURANT et MOT_DE_PASSE_RESTAURANT (8 caractères minimum)."
    );
  }

  await connecter();

  const restaurant = await Restaurant.findOne({
    nom: {
      $regex: `^${echapperRegex(nomRestaurant)}$`,
      $options: "i"
    }
  });

  if (!restaurant) {
    throw new Error(
      `Restaurant introuvable avec le nom « ${nomRestaurant} ».`
    );
  }

  const motDePasseHache = await bcrypt.hash(motDePasse, 12);

  const utilisateur = await Utilisateur.findOneAndUpdate(
    { courriel },
    {
      nom,
      courriel,
      motDePasse: motDePasseHache,
      role: "restaurant",
      restaurantId: restaurant._id
    },
    {
      upsert: true,
      new: true,
      runValidators: true
    }
  );

  console.log(
    `Compte restaurant prêt : ${utilisateur.courriel} → ${restaurant.nom}`
  );

  await mongoose.disconnect();
})().catch(async (erreur) => {
  console.error(erreur.message);
  await mongoose.disconnect();
  process.exit(1);
});