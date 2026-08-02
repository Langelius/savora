const Commande = require("../models/Commande");
const Message = require("../models/Message");
const Utilisateur = require("../models/Utilisateur");
const { emettreMessageCommande } = require("../config/socket");

async function verifierAccesCommande(commande, utilisateurConnecte) {
  const utilisateurId = String(utilisateurConnecte.id);
  const clientId = String(commande.utilisateurId?._id || commande.utilisateurId);
  const livreurId = commande.livreurId ? String(commande.livreurId?._id || commande.livreurId) : null;

  if (utilisateurConnecte.role === "admin") return true;
  if (utilisateurConnecte.role === "client") return clientId === utilisateurId;
  if (utilisateurConnecte.role === "livreur") return livreurId === utilisateurId;

  if (utilisateurConnecte.role === "restaurant") {
    const utilisateur = await Utilisateur.findById(utilisateurId).select("restaurantId");
    return Boolean(utilisateur?.restaurantId) &&
      String(utilisateur.restaurantId) === String(commande.restaurantId?._id || commande.restaurantId);
  }

  return false;
}

async function listerMessages(req, res) {
  const commande = await Commande.findById(req.params.id);
  if (!commande) return res.status(404).json({ message: "Commande introuvable" });
  if (!(await verifierAccesCommande(commande, req.utilisateur))) {
    return res.status(403).json({ message: "Accès interdit à cette discussion" });
  }

  const messages = await Message.find({ commandeId: commande._id })
    .populate("auteurId", "nom role")
    .sort({ createdAt: 1 });

  res.json({ messages });
}

async function envoyerMessage(req, res) {
  const texte = String(req.body.texte || "").trim();
  if (!texte) return res.status(400).json({ message: "Le message est vide" });
  if (texte.length > 1000) return res.status(400).json({ message: "Le message est trop long" });

  const commande = await Commande.findById(req.params.id);
  if (!commande) return res.status(404).json({ message: "Commande introuvable" });
  if (!(await verifierAccesCommande(commande, req.utilisateur))) {
    return res.status(403).json({ message: "Accès interdit à cette discussion" });
  }

  let message = await Message.create({
    commandeId: commande._id,
    auteurId: req.utilisateur.id,
    texte,
  });
  message = await message.populate("auteurId", "nom role");
  emettreMessageCommande(commande._id, message);

  res.status(201).json({ message });
}

module.exports = { listerMessages, envoyerMessage };
