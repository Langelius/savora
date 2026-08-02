const Commande = require("../models/Commande");
const Plat = require("../models/Plat");
const Restaurant = require("../models/Restaurant");
const Utilisateur = require("../models/Utilisateur");
const { emettreMiseAJourCommande } = require("../config/socket");

const TRANSITIONS = {
  "en attente": ["confirmée", "annulée"],
  "confirmée": ["en préparation", "annulée"],
  "en préparation": ["prête", "annulée"],
  "prête": ["prise en charge"],
  "prise en charge": ["en route"],
  "en route": ["livrée"],
  "livrée": [],
  "annulée": [],
};

const STATUTS_RESTAURANT = ["confirmée", "en préparation", "prête", "annulée"];
const STATUTS_LIVREUR = ["en route", "livrée"];
const POPULATE_COMMANDE = [
  { path: "restaurantId", select: "nom image delai adresse" },
  { path: "livreurId", select: "nom telephone" },
  { path: "utilisateurId", select: "nom telephone" },
];

async function peuplerCommande(commande) {
  for (const option of POPULATE_COMMANDE) await commande.populate(option);
  return commande;
}

async function creerCommande(req, res) {
  const { restaurantId, plats, adresseLivraison, methodePaiement = "carte", paiement } = req.body;
  if (!restaurantId || !Array.isArray(plats) || plats.length === 0 || !adresseLivraison) {
    return res.status(400).json({ message: "Restaurant, plats et adresse sont obligatoires" });
  }

  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant || !restaurant.actif) return res.status(404).json({ message: "Restaurant introuvable" });

  const ids = plats.map((p) => p.platId);
  const platsDb = await Plat.find({ _id: { $in: ids }, restaurantId, disponible: true });
  if (platsDb.length !== new Set(ids.map(String)).size) {
    return res.status(400).json({ message: "Un ou plusieurs plats sont invalides" });
  }

  const lignes = plats.map((ligne) => {
    const plat = platsDb.find((p) => String(p._id) === String(ligne.platId));
    const quantite = Math.max(1, Number(ligne.quantite) || 1);
    return { platId: plat._id, nom: plat.nom, prix: plat.prix, quantite, options: Array.isArray(ligne.options) ? ligne.options : [] };
  });

  const sousTotal = Number(lignes.reduce((total, ligne) => total + ligne.prix * ligne.quantite, 0).toFixed(2));
  const fraisLivraison = restaurant.fraisLivraison;
  const taxes = Number((sousTotal * 0.14975).toFixed(2));
  const total = Number((sousTotal + fraisLivraison + taxes).toFixed(2));

  if (!["carte", "livraison"].includes(methodePaiement)) {
    return res.status(400).json({ message: "Méthode de paiement invalide" });
  }

  let statutPaiement = "à payer";
  let referencePaiement = null;
  let datePaiement = null;

  if (methodePaiement === "carte") {
    const numero = String(paiement?.numero || "").replace(/\s/g, "");
    const expiration = String(paiement?.expiration || "").trim();
    const cvv = String(paiement?.cvv || "").trim();
    const titulaire = String(paiement?.titulaire || "").trim();
    if (!/^\d{16}$/.test(numero) || !/^\d{2}\/\d{2}$/.test(expiration) || !/^\d{3,4}$/.test(cvv) || titulaire.length < 3) {
      return res.status(400).json({ message: "Informations de carte invalides" });
    }
    statutPaiement = "payé";
    referencePaiement = `SIM-${Date.now()}-${numero.slice(-4)}`;
    datePaiement = new Date();
  }

  let commande = await Commande.create({
    utilisateurId: req.utilisateur.id,
    restaurantId,
    plats: lignes,
    sousTotal,
    fraisLivraison,
    taxes,
    total,
    adresseLivraison,
    methodePaiement,
    statutPaiement,
    referencePaiement,
    datePaiement,
  });
  commande = await peuplerCommande(commande);

  emettreMiseAJourCommande(commande, "commande:nouvelle");
  res.status(201).json({ commande });
}

async function listerMesCommandes(req, res) {
  let filtre = {};
  if (req.utilisateur.role === "client") filtre = { utilisateurId: req.utilisateur.id };
  if (req.utilisateur.role === "livreur") filtre = { livreurId: req.utilisateur.id };
  if (req.utilisateur.role === "restaurant") {
    const utilisateur = await Utilisateur.findById(req.utilisateur.id).select("restaurantId");
    if (!utilisateur?.restaurantId) return res.status(400).json({ message: "Ce compte restaurant n'est lié à aucun restaurant" });
    filtre = { restaurantId: utilisateur.restaurantId };
  }

  const commandes = await Commande.find(filtre).populate(POPULATE_COMMANDE).sort({ createdAt: -1 });
  res.json({ commandes });
}

async function listerCommandesDisponibles(req, res) {
  const commandes = await Commande.find({ statut: "prête", livreurId: null })
    .populate(POPULATE_COMMANDE)
    .sort({ updatedAt: 1 });
  res.json({ commandes });
}

async function accepterLivraison(req, res) {
  // findOneAndUpdate rend l'attribution atomique : deux livreurs ne peuvent pas prendre la même commande.
  let commande = await Commande.findOneAndUpdate(
    { _id: req.params.id, statut: "prête", livreurId: null },
    {
      $set: { livreurId: req.utilisateur.id, statut: "prise en charge" },
      $push: { historiqueStatuts: { statut: "prise en charge", modifiePar: req.utilisateur.id, date: new Date() } },
    },
    { new: true, runValidators: true }
  );

  if (!commande) {
    const existe = await Commande.exists({ _id: req.params.id });
    return res.status(existe ? 409 : 404).json({
      message: existe ? "Cette livraison a déjà été acceptée ou n'est plus disponible" : "Commande introuvable",
    });
  }

  commande = await peuplerCommande(commande);
  emettreMiseAJourCommande(commande, "commande:attribuee");
  res.json({ commande });
}

async function obtenirCommande(req, res) {
  const commande = await Commande.findById(req.params.id).populate(POPULATE_COMMANDE);
  if (!commande) return res.status(404).json({ message: "Commande introuvable" });

  const estProprietaire = String(commande.utilisateurId?._id || commande.utilisateurId) === String(req.utilisateur.id);
  const estLivreur = commande.livreurId && String(commande.livreurId._id || commande.livreurId) === String(req.utilisateur.id);
  if (req.utilisateur.role === "client" && !estProprietaire) return res.status(403).json({ message: "Accès interdit" });
  if (req.utilisateur.role === "livreur" && !estLivreur) return res.status(403).json({ message: "Accès interdit" });
  if (req.utilisateur.role === "restaurant") {
    const utilisateur = await Utilisateur.findById(req.utilisateur.id).select("restaurantId");
    if (!utilisateur?.restaurantId || String(utilisateur.restaurantId) !== String(commande.restaurantId?._id || commande.restaurantId)) {
      return res.status(403).json({ message: "Cette commande n'appartient pas à votre restaurant" });
    }
  }

  res.json({ commande });
}

async function modifierStatut(req, res) {
  const nouveauStatut = String(req.body.statut || "");
  const commande = await Commande.findById(req.params.id);
  if (!commande) return res.status(404).json({ message: "Commande introuvable" });
  if (!Commande.STATUTS.includes(nouveauStatut)) return res.status(400).json({ message: "Statut invalide" });

  if (req.utilisateur.role === "restaurant") {
    const utilisateur = await Utilisateur.findById(req.utilisateur.id).select("restaurantId");
    if (!utilisateur?.restaurantId || String(utilisateur.restaurantId) !== String(commande.restaurantId)) {
      return res.status(403).json({ message: "Cette commande n'appartient pas à votre restaurant" });
    }
    if (!STATUTS_RESTAURANT.includes(nouveauStatut)) return res.status(403).json({ message: "Ce statut doit être géré par un livreur" });
  }
  if (req.utilisateur.role === "livreur") {
    if (!commande.livreurId || String(commande.livreurId) !== String(req.utilisateur.id)) {
      return res.status(403).json({ message: "Cette livraison ne vous est pas attribuée" });
    }
    if (!STATUTS_LIVREUR.includes(nouveauStatut)) return res.status(403).json({ message: "Utilisez le bouton Accepter pour prendre une livraison" });
  }

  if (!TRANSITIONS[commande.statut].includes(nouveauStatut)) {
    return res.status(409).json({ message: `Transition impossible : ${commande.statut} → ${nouveauStatut}` });
  }

  commande.statut = nouveauStatut;
  commande.historiqueStatuts.push({ statut: nouveauStatut, modifiePar: req.utilisateur.id });
  await commande.save();
  await peuplerCommande(commande);

  emettreMiseAJourCommande(commande);
  res.json({ commande });
}

module.exports = {
  creerCommande,
  listerMesCommandes,
  listerCommandesDisponibles,
  accepterLivraison,
  obtenirCommande,
  modifierStatut,
};
