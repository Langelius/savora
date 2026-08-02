const Commande = require("../models/Commande");
const Message = require("../models/Message");
const { emettreMessageCommande } = require("../config/socket");

// Une discussion est rattachée à une commande. Y ont accès : le client qui a
// commandé, le restaurant concerné, le livreur assigné, et l'administration.
function verifierAccesCommande(commande, utilisateur) {
  if (utilisateur.role === "admin") return true;

  const clientId = String(commande.utilisateurId?._id || commande.utilisateurId);
  const livreurId = commande.livreurId
    ? String(commande.livreurId?._id || commande.livreurId)
    : null;
  const restaurantId = String(commande.restaurantId?._id || commande.restaurantId);

  if (utilisateur.role === "client") return clientId === utilisateur.id;
  if (utilisateur.role === "livreur") return livreurId === utilisateur.id;
  if (utilisateur.role === "restaurant") return utilisateur.restaurantId === restaurantId;

  return false;
}

async function listerMessages(requete, reponse) {
  const commande = await Commande.findById(requete.params.id);
  if (!commande) return reponse.status(404).json({ message: "Commande introuvable" });

  if (!verifierAccesCommande(commande, requete.utilisateur)) {
    return reponse.status(403).json({ message: "Accès interdit à cette discussion" });
  }

  const messages = await Message.find({ commandeId: commande._id })
    .populate("auteurId", "nom role")
    .sort({ createdAt: 1 })
    .limit(500);

  reponse.json({ messages });
}

async function envoyerMessage(requete, reponse) {
  const texte = String(requete.body.texte || "").trim();

  if (!texte) return reponse.status(400).json({ message: "Le message est vide" });
  if (texte.length > 1000) return reponse.status(400).json({ message: "Le message est trop long" });

  const commande = await Commande.findById(requete.params.id);
  if (!commande) return reponse.status(404).json({ message: "Commande introuvable" });

  if (!verifierAccesCommande(commande, requete.utilisateur)) {
    return reponse.status(403).json({ message: "Accès interdit à cette discussion" });
  }

  // Une commande terminée depuis longtemps n'a plus à recevoir de messages.
  if (commande.statut === "annulée") {
    return reponse.status(409).json({ message: "Cette commande est annulée" });
  }

  let message = await Message.create({
    commandeId: commande._id,
    auteurId: requete.utilisateur.id,
    texte,
  });

  message = await message.populate("auteurId", "nom role");
  emettreMessageCommande(commande._id, message);

  reponse.status(201).json({ message });
}

module.exports = { listerMessages, envoyerMessage, verifierAccesCommande };
