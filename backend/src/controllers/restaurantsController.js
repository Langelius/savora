const Restaurant = require("../models/Restaurant");
const Plat = require("../models/Plat");
const Avis = require("../models/Avis");
const { construireRecherche } = require("../utils/texte");

async function listerRestaurants(requete, reponse) {
  const filtre = { actif: true };

  // La saisie est échappée avant d'entrer dans un $regex (voir utils/texte.js).
  const recherche = construireRecherche(requete.query.recherche, ["nom", "cuisine"]);
  if (recherche) Object.assign(filtre, recherche);

  const restaurants = await Restaurant.find(filtre).sort({ note: -1, nom: 1 }).limit(100);
  reponse.json({ restaurants });
}

async function obtenirRestaurant(requete, reponse) {
  const restaurant = await Restaurant.findOne({ _id: requete.params.id, actif: true });
  if (!restaurant) return reponse.status(404).json({ message: "Restaurant introuvable" });

  const plats = await Plat.find({ restaurantId: restaurant._id, disponible: true }).sort({
    populaire: -1,
    categorie: 1,
    nom: 1,
  });

  reponse.json({ restaurant, plats });
}

// Avis publics d'un restaurant, du plus récent au plus ancien.
async function listerAvisRestaurant(requete, reponse) {
  const restaurant = await Restaurant.findById(requete.params.id).select("nom note nombreAvis");
  if (!restaurant) return reponse.status(404).json({ message: "Restaurant introuvable" });

  const avis = await Avis.find({ restaurantId: restaurant._id })
    .populate("utilisateurId", "nom")
    .sort({ createdAt: -1 })
    .limit(50);

  reponse.json({
    restaurant: {
      _id: restaurant._id,
      nom: restaurant.nom,
      note: restaurant.note,
      nombreAvis: restaurant.nombreAvis,
    },
    avis,
  });
}

module.exports = { listerRestaurants, obtenirRestaurant, listerAvisRestaurant };
