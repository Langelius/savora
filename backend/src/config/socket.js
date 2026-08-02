const jwt = require("jsonwebtoken");
const Utilisateur = require("../models/Utilisateur");

let io = null;

function initialiserSocket(serveurHttp) {
  const { Server } = require("socket.io");
  const { politiqueCors } = require("../middleware/securite");

  // Même liste blanche que l'API : le canal temps réel ne doit pas être une
  // porte plus permissive que les routes REST.
  io = new Server(serveurHttp, { cors: politiqueCors() });

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

// Déclenche les notifications poussées liées à un événement de commande.
//
// L'appel n'est jamais attendu et ses erreurs sont absorbées : une
// notification qui échoue ne doit pas faire échouer un changement de statut.
function declencherNotifications(commande, evenement) {
  const notifications = require("../services/notifications");

  const traiter = async () => {
    if (evenement === "commande:nouvelle") {
      const Utilisateur = require("../models/Utilisateur");
      const restaurantId = commande.restaurantId?._id || commande.restaurantId;

      const gestionnaires = await Utilisateur.find({
        role: "restaurant",
        restaurantId,
      }).select("_id");

      const identifiants = [];
      for (const gestionnaire of gestionnaires) identifiants.push(gestionnaire._id);

      await notifications.notifierNouvelleCommande(commande, identifiants);
      return;
    }

    await notifications.notifierChangementStatut(commande);
  };

  traiter().catch((erreur) => {
    console.error("Notifications :", erreur.message);
  });
}

function emettreMiseAJourCommande(commande, evenement = "commande:mise-a-jour") {
  if (!commande?._id) return;

  // Les notifications poussées partent même si Socket.IO n'est pas initialisé
  // (cas des tests) : ce sont deux canaux indépendants.
  declencherNotifications(commande, evenement);

  if (!io) return;
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
