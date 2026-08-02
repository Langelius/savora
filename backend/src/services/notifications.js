// Notifications poussées.
//
// Deux canaux complémentaires, pour la même raison que le double mode de
// paiement : la démonstration doit fonctionner dans Expo Go.
//
//   1. Push distantes — via le service Expo Push. Elles atteignent l'appareil
//      même application fermée, mais depuis le SDK 53 elles ne fonctionnent
//      plus dans Expo Go sur Android : un development build est nécessaire.
//   2. Notification locale — l'application affiche elle-même une notification
//      à la réception de l'événement Socket.IO. Fonctionne partout, mais
//      seulement si l'application est ouverte.
//
// Le serveur envoie toujours le canal 1 s'il connaît un jeton, et émet
// toujours l'événement du canal 2. L'application décide quoi afficher.

// Chargement paresseux : les fonctions de composition de message restent
// utilisables (et testables) sans connexion à la base de données.
function modeleAppareil() {
  return require("../models/AppareilNotification");
}

const URL_EXPO_PUSH = "https://exp.host/--/api/v2/push/send";
const TAILLE_LOT = 100; // limite recommandée par Expo

// Un jeton Expo a toujours cette forme. Vérifier évite d'envoyer des appels
// inutiles au service et de conserver des valeurs fantaisistes en base.
const FORMAT_JETON_EXPO = /^Expo(nent)?PushToken\[[^\]]+\]$/;

function jetonValide(jeton) {
  return FORMAT_JETON_EXPO.test(String(jeton || "").trim());
}

// Messages affichés selon l'étape atteinte par la commande.
const MESSAGES = {
  "confirmée": {
    titre: "Commande confirmée",
    corps: (c) => `${nomRestaurant(c)} a accepté ta commande.`,
  },
  "en préparation": {
    titre: "En préparation",
    corps: (c) => `${nomRestaurant(c)} prépare ton repas.`,
  },
  "prête": {
    titre: "Commande prête",
    corps: () => "Ton repas attend un livreur.",
  },
  "prise en charge": {
    titre: "Livreur assigné",
    corps: (c) => `${nomLivreur(c)} récupère ta commande.`,
  },
  "en route": {
    titre: "En route",
    corps: (c) => `${nomLivreur(c)} arrive avec ton repas.`,
  },
  "livrée": {
    titre: "Bon appétit",
    corps: () => "Ta commande est livrée. Pense à noter le restaurant.",
  },
  "annulée": {
    titre: "Commande annulée",
    corps: () => "Ta commande a été annulée.",
  },
};

function nomRestaurant(commande) {
  return commande.restaurantId?.nom || "Le restaurant";
}

function nomLivreur(commande) {
  return commande.livreurId?.nom || "Un livreur";
}

// Construit le contenu de la notification pour un changement de statut.
function composerMessage(commande) {
  const modele = MESSAGES[commande.statut];
  if (!modele) return null;

  return {
    title: modele.titre,
    body: modele.corps(commande),
    sound: "default",
    // Permet à l'application d'ouvrir directement le suivi au clic.
    data: { commandeId: String(commande._id), statut: commande.statut },
  };
}

// Enregistre ou réattribue le jeton d'un appareil.
async function enregistrerAppareil(utilisateurId, jeton, plateforme = "inconnue") {
  if (!jetonValide(jeton)) {
    const erreur = new Error("Jeton de notification invalide");
    erreur.status = 400;
    throw erreur;
  }

  return modeleAppareil().findOneAndUpdate(
    { jeton: String(jeton).trim() },
    { utilisateurId, plateforme, derniereUtilisation: new Date() },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function oublierAppareil(jeton) {
  await modeleAppareil().deleteOne({ jeton: String(jeton || "").trim() });
}

// Envoie une notification à tous les appareils d'un ou plusieurs utilisateurs.
//
// Les échecs n'interrompent jamais le flux métier : une notification perdue
// est moins grave qu'un changement de statut qui échoue. On journalise et
// on continue.
async function envoyerAUtilisateurs(identifiants, message) {
  if (!message) return { envoyes: 0 };

  const cibles = [];
  for (const identifiant of identifiants) {
    if (identifiant) cibles.push(String(identifiant));
  }
  if (cibles.length === 0) return { envoyes: 0 };

  let appareils;
  try {
    appareils = await modeleAppareil().find({ utilisateurId: { $in: cibles } }).select("jeton");
  } catch (erreur) {
    console.error("Notifications : lecture des appareils impossible —", erreur.message);
    return { envoyes: 0 };
  }

  if (appareils.length === 0) return { envoyes: 0 };

  const messages = [];
  for (const appareil of appareils) {
    messages.push({ to: appareil.jeton, ...message });
  }

  let envoyes = 0;
  for (let debut = 0; debut < messages.length; debut += TAILLE_LOT) {
    const lot = messages.slice(debut, debut + TAILLE_LOT);

    try {
      const reponse = await fetch(URL_EXPO_PUSH, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(lot),
      });

      if (!reponse.ok) {
        console.error(`Notifications : Expo a répondu ${reponse.status}`);
        continue;
      }

      const resultat = await reponse.json();
      const tickets = Array.isArray(resultat?.data) ? resultat.data : [];

      for (let i = 0; i < tickets.length; i += 1) {
        const ticket = tickets[i];
        if (ticket?.status === "ok") {
          envoyes += 1;
          continue;
        }

        // Expo signale les jetons devenus invalides : on les retire pour ne
        // pas conserver indéfiniment des appareils désinstallés.
        if (ticket?.details?.error === "DeviceNotRegistered") {
          await oublierAppareil(lot[i].to);
        }
      }
    } catch (erreur) {
      console.error("Notifications : envoi impossible —", erreur.message);
    }
  }

  return { envoyes };
}

// Notifie les parties concernées par un changement de statut.
// Le client est toujours prévenu ; le livreur l'est aussi une fois assigné.
async function notifierChangementStatut(commande) {
  const message = composerMessage(commande);
  if (!message) return;

  const destinataires = [commande.utilisateurId?._id || commande.utilisateurId];

  if (commande.statut === "livrée" || commande.statut === "annulée") {
    const livreur = commande.livreurId?._id || commande.livreurId;
    if (livreur) destinataires.push(livreur);
  }

  await envoyerAUtilisateurs(destinataires, message);
}

// Prévient le restaurant qu'une commande vient d'arriver.
async function notifierNouvelleCommande(commande, gestionnairesIds) {
  await envoyerAUtilisateurs(gestionnairesIds, {
    title: "Nouvelle commande",
    body: `Une commande de ${Number(commande.total).toFixed(2)} $ vient d'arriver.`,
    sound: "default",
    data: { commandeId: String(commande._id), statut: commande.statut },
  });
}

module.exports = {
  enregistrerAppareil,
  oublierAppareil,
  notifierChangementStatut,
  notifierNouvelleCommande,
  composerMessage,
  jetonValide,
};
