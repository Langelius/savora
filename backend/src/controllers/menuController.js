// Gestion des établissements et de leurs menus.
//
// Ce contrôleur est partagé par deux rôles :
//   - l'administrateur, qui agit sur n'importe quel restaurant ;
//   - le gestionnaire de restaurant, qui n'agit que sur le sien.
//
// Le cloisonnement ne repose pas sur la route appelée mais sur la fonction
// resoudreRestaurant(), qui vérifie systématiquement le droit d'accès.

const bcrypt = require("bcrypt");

const Restaurant = require("../models/Restaurant");
const Plat = require("../models/Plat");
const Utilisateur = require("../models/Utilisateur");
const {
  erreur,
  lireChampsRestaurant,
  lireChampsPlat,
} = require("../services/validationMenu");

const TOURS_BCRYPT = 12;
const FORMAT_COURRIEL = /^\S+@\S+\.\S+$/;

// Détermine sur quel restaurant porte la requête et vérifie le droit d'accès.
// L'administrateur désigne le restaurant par l'URL ; le gestionnaire ne peut
// agir que sur celui auquel son compte est rattaché.
async function resoudreRestaurant(requete) {
  const utilisateur = requete.utilisateur;

  let identifiant;
  if (utilisateur.role === "admin") {
    identifiant = requete.params.restaurantId || requete.params.id;
  } else if (utilisateur.role === "restaurant") {
    if (!utilisateur.restaurantId) {
      throw erreur("Ce compte n'est rattaché à aucun restaurant", 400);
    }
    identifiant = utilisateur.restaurantId;

    // Un gestionnaire qui tenterait de viser un autre établissement par l'URL
    // est refusé explicitement, plutôt que silencieusement redirigé.
    const vise = requete.params.restaurantId || requete.params.id;
    if (vise && String(vise) !== String(identifiant)) {
      throw erreur("Vous ne pouvez gérer que votre propre restaurant", 403);
    }
  } else {
    throw erreur("Accès interdit", 403);
  }

  const restaurant = await Restaurant.findById(identifiant);
  if (!restaurant) throw erreur("Restaurant introuvable", 404);

  return restaurant;
}

// ── Établissements ────────────────────────────────────────────────────────

// POST /api/admin/restaurants
// Crée l'établissement, et éventuellement le compte gestionnaire associé.
async function creerRestaurant(requete, reponse) {
  const champs = lireChampsRestaurant(requete.body, { creation: true });

  const existe = await Restaurant.findOne({ nom: champs.nom });
  if (existe) throw erreur("Un restaurant porte déjà ce nom", 409);

  const restaurant = await Restaurant.create(champs);

  // Rattachement facultatif d'un gestionnaire, pour éviter le passage
  // obligatoire par la ligne de commande.
  let gestionnaire = null;
  const demande = requete.body.gestionnaire;

  if (demande && demande.courriel) {
    const courriel = String(demande.courriel).trim().toLowerCase();
    if (!FORMAT_COURRIEL.test(courriel)) {
      throw erreur("Le courriel du gestionnaire n'est pas valide", 400);
    }

    const compteExistant = await Utilisateur.findOne({ courriel });

    if (compteExistant) {
      // Compte déjà présent : on le promeut et on le rattache.
      compteExistant.role = "restaurant";
      compteExistant.restaurantId = restaurant._id;
      await compteExistant.save();
      gestionnaire = compteExistant;
    } else {
      const motDePasse = String(demande.motDePasse || "");
      if (motDePasse.length < 8) {
        throw erreur("Le mot de passe du gestionnaire doit faire 8 caractères minimum", 400);
      }

      gestionnaire = await Utilisateur.create({
        nom: String(demande.nom || `Gestionnaire ${restaurant.nom}`).trim(),
        courriel,
        motDePasse: await bcrypt.hash(motDePasse, TOURS_BCRYPT),
        role: "restaurant",
        restaurantId: restaurant._id,
      });
    }
  }

  reponse.status(201).json({
    restaurant,
    gestionnaire: gestionnaire
      ? { id: gestionnaire._id, nom: gestionnaire.nom, courriel: gestionnaire.courriel }
      : null,
  });
}

// PUT /api/admin/restaurants/:id  ·  PUT /api/mon-restaurant
async function modifierRestaurant(requete, reponse) {
  const restaurant = await resoudreRestaurant(requete);
  const champs = lireChampsRestaurant(requete.body, { creation: false });

  // Un gestionnaire ne décide pas seul de rendre son établissement visible :
  // l'activation reste une prérogative de l'administration.
  if (requete.utilisateur.role !== "admin") delete champs.actif;

  if (Object.keys(champs).length === 0) {
    throw erreur("Aucun champ à modifier", 400);
  }

  if (champs.nom && champs.nom !== restaurant.nom) {
    const doublon = await Restaurant.findOne({ nom: champs.nom, _id: { $ne: restaurant._id } });
    if (doublon) throw erreur("Un restaurant porte déjà ce nom", 409);
  }

  Object.assign(restaurant, champs);
  await restaurant.save();

  reponse.json({ restaurant });
}

// GET /api/mon-restaurant
async function obtenirMonRestaurant(requete, reponse) {
  const restaurant = await resoudreRestaurant(requete);
  const plats = await Plat.find({ restaurantId: restaurant._id }).sort({
    categorie: 1,
    nom: 1,
  });

  reponse.json({ restaurant, plats });
}

// ── Plats ─────────────────────────────────────────────────────────────────

// GET .../plats — inclut les plats indisponibles, contrairement à la vue client.
async function listerPlats(requete, reponse) {
  const restaurant = await resoudreRestaurant(requete);
  const plats = await Plat.find({ restaurantId: restaurant._id }).sort({
    categorie: 1,
    nom: 1,
  });

  reponse.json({ restaurant, plats });
}

// POST .../plats
async function creerPlat(requete, reponse) {
  const restaurant = await resoudreRestaurant(requete);
  const champs = lireChampsPlat(requete.body, { creation: true });

  const plat = await Plat.create({ ...champs, restaurantId: restaurant._id });
  reponse.status(201).json({ plat });
}

// Retrouve un plat en s'assurant qu'il appartient bien au restaurant autorisé.
async function resoudrePlat(requete) {
  const plat = await Plat.findById(requete.params.platId);
  if (!plat) throw erreur("Plat introuvable", 404);

  const utilisateur = requete.utilisateur;
  if (utilisateur.role === "restaurant") {
    if (String(plat.restaurantId) !== String(utilisateur.restaurantId)) {
      throw erreur("Ce plat n'appartient pas à votre restaurant", 403);
    }
  } else if (utilisateur.role !== "admin") {
    throw erreur("Accès interdit", 403);
  }

  return plat;
}

// PUT .../plats/:platId
async function modifierPlat(requete, reponse) {
  const plat = await resoudrePlat(requete);
  const champs = lireChampsPlat(requete.body, { creation: false });

  if (Object.keys(champs).length === 0) throw erreur("Aucun champ à modifier", 400);

  Object.assign(plat, champs);
  await plat.save();

  reponse.json({ plat });
}

// DELETE .../plats/:platId
//
// Le plat n'est pas réellement supprimé : des commandes passées le référencent.
// Il est rendu indisponible, ce qui le retire du menu client sans casser
// l'historique. Une suppression définitive reste possible pour l'administration.
async function supprimerPlat(requete, reponse) {
  const plat = await resoudrePlat(requete);
  const definitive = requete.query.definitive === "true" && requete.utilisateur.role === "admin";

  if (definitive) {
    await plat.deleteOne();
    return reponse.json({ message: "Plat supprimé définitivement" });
  }

  plat.disponible = false;
  await plat.save();

  reponse.json({ message: "Plat retiré du menu", plat });
}

module.exports = {
  creerRestaurant,
  modifierRestaurant,
  obtenirMonRestaurant,
  listerPlats,
  creerPlat,
  modifierPlat,
  supprimerPlat,
};
