const Avis = require("../models/Avis");
const Commande = require("../models/Commande");
const Restaurant = require("../models/Restaurant");
const { emettreMiseAJourCommande } = require("../config/socket");

// Recalcule la note moyenne d'un restaurant à partir de tous ses avis.
// L'agrégation est faite par MongoDB plutôt que dans Node : la moyenne reste
// juste même si plusieurs avis sont déposés en même temps.
async function recalculerNoteRestaurant(restaurantId) {
  const resultat = await Avis.aggregate([
    { $match: { restaurantId } },
    { $group: { _id: "$restaurantId", moyenne: { $avg: "$note" }, nombre: { $sum: 1 } } },
  ]);

  const agregat = resultat[0] || { moyenne: 0, nombre: 0 };
  const moyenneArrondie = Math.round(agregat.moyenne * 10) / 10;

  await Restaurant.findByIdAndUpdate(restaurantId, {
    note: moyenneArrondie,
    nombreAvis: agregat.nombre,
  });

  return { note: moyenneArrondie, nombreAvis: agregat.nombre };
}

// POST /api/commandes/:id/avis
async function deposerAvis(requete, reponse) {
  const note = Number(requete.body.note);
  const commentaire = String(requete.body.commentaire || "").trim();

  if (!Number.isInteger(note) || note < 1 || note > 5) {
    return reponse.status(400).json({ message: "La note doit être un entier de 1 à 5" });
  }
  if (commentaire.length > 600) {
    return reponse.status(400).json({ message: "Le commentaire est trop long (600 caractères)" });
  }

  const commande = await Commande.findById(requete.params.id);
  if (!commande) return reponse.status(404).json({ message: "Commande introuvable" });

  // Seul le client qui a passé la commande peut la noter.
  if (String(commande.utilisateurId) !== requete.utilisateur.id) {
    return reponse.status(403).json({ message: "Cette commande n'est pas la vôtre" });
  }

  // Et seulement une fois le repas réellement livré.
  if (commande.statut !== "livrée") {
    return reponse.status(409).json({
      message: "La notation n'est possible qu'après la livraison",
    });
  }

  if (await Avis.exists({ commandeId: commande._id })) {
    return reponse.status(409).json({ message: "Cette commande a déjà été notée" });
  }

  const avis = await Avis.create({
    commandeId: commande._id,
    restaurantId: commande.restaurantId,
    utilisateurId: requete.utilisateur.id,
    note,
    commentaire,
  });

  commande.avisDepose = true;
  await commande.save();

  const restaurant = await recalculerNoteRestaurant(commande.restaurantId);

  emettreMiseAJourCommande(commande, "commande:notee");

  reponse.status(201).json({ avis, restaurant });
}

// GET /api/commandes/:id/avis — permet à l'application de savoir si la
// commande a déjà été notée et de réafficher l'avis existant.
async function obtenirAvisCommande(requete, reponse) {
  const commande = await Commande.findById(requete.params.id).select(
    "utilisateurId restaurantId"
  );
  if (!commande) return reponse.status(404).json({ message: "Commande introuvable" });

  const estClient = String(commande.utilisateurId) === requete.utilisateur.id;
  if (!estClient && requete.utilisateur.role !== "admin") {
    return reponse.status(403).json({ message: "Accès interdit" });
  }

  const avis = await Avis.findOne({ commandeId: commande._id }).populate("utilisateurId", "nom");
  reponse.json({ avis });
}

module.exports = { deposerAvis, obtenirAvisCommande, recalculerNoteRestaurant };
