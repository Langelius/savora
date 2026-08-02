const jwt = require("jsonwebtoken");
const Utilisateur = require("../models/Utilisateur");

let io = null;

function initialiserSocket(serveurHttp) {
  const { Server } = require("socket.io");
  io = new Server(serveurHttp, {
    cors: { origin: true, credentials: true },
  });

  io.use(async (socket, suivant) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return suivant(new Error("Authentification requise"));
      const charge = jwt.verify(token, process.env.JWT_SECRET);
      const utilisateur = await Utilisateur.findById(charge.id).select("role restaurantId");
      if (!utilisateur) return suivant(new Error("Utilisateur introuvable"));
      socket.utilisateur = utilisateur;
      suivant();
    } catch (_erreur) {
      suivant(new Error("Jeton invalide"));
    }
  });

  io.on("connection", (socket) => {
    const utilisateur = socket.utilisateur;
    socket.join(`utilisateur:${utilisateur._id}`);
    socket.join(`role:${utilisateur.role}`);
    if (utilisateur.role === "restaurant" && utilisateur.restaurantId) {
      socket.join(`restaurant:${utilisateur.restaurantId}`);
    }

    socket.on("commande:rejoindre", (commandeId) => {
      if (commandeId) socket.join(`commande:${commandeId}`);
    });

    socket.on("commande:quitter", (commandeId) => {
      if (commandeId) socket.leave(`commande:${commandeId}`);
    });
  });

  return io;
}

function emettreMiseAJourCommande(commande, evenement = "commande:mise-a-jour") {
  if (!io || !commande?._id) return;
  io.to(`commande:${commande._id}`).emit(evenement, commande);
  io.to(`utilisateur:${commande.utilisateurId}`).emit(evenement, commande);
  io.to(`restaurant:${commande.restaurantId?._id || commande.restaurantId}`).emit(evenement, commande);
  if (commande.livreurId) {
    io.to(`utilisateur:${commande.livreurId?._id || commande.livreurId}`).emit(evenement, commande);
  }
  if (commande.statut === "prête" && !commande.livreurId) {
    io.to("role:livreur").emit("commande:disponible", commande);
  } else {
    io.to("role:livreur").emit(evenement, commande);
  }
  io.to("role:admin").emit(evenement, commande);
}

function emettreMessageCommande(commandeId, message) {
  if (!io || !commandeId) return;
  io.to(`commande:${commandeId}`).emit("discussion:nouveau-message", message);
}

module.exports = { initialiserSocket, emettreMiseAJourCommande, emettreMessageCommande };
