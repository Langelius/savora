const Commande = require("../models/Commande");
const Plat = require("../models/Plat");
const Restaurant = require("../models/Restaurant");
const { emettreMiseAJourCommande } = require("../config/socket");
const { calculerPrixLigne, calculerTotaux } = require("../services/tarification");
const { payerCommande } = require("../services/paiement");
const {
  estStatutConnu,
  transitionAutorisee,
  roleAutorise,
} = require("../services/statutsCommande");

const POPULATE_COMMANDE = [
  { path: "restaurantId", select: "nom image delai adresse fraisLivraison" },
  { path: "livreurId", select: "nom telephone" },
  { path: "utilisateurId", select: "nom telephone" },
];

const PAGE_PAR_DEFAUT = 20;
const PAGE_MAXIMUM = 100;

function lirePagination(requete) {
  const page = Math.max(1, Number(requete.query.page) || 1);
  const taille = Math.min(
    PAGE_MAXIMUM,
    Math.max(1, Number(requete.query.taille) || PAGE_PAR_DEFAUT)
  );
  return { page, taille, saut: (page - 1) * taille };
}

async function peuplerCommande(commande) {
  for (const option of POPULATE_COMMANDE) {
    await commande.populate(option);
  }
  return commande;
}

// Vérifie qu'un compte restaurant agit bien sur une commande de son restaurant.
function restaurantCorrespond(utilisateur, commande) {
  const idCommande = String(commande.restaurantId?._id || commande.restaurantId);
  return Boolean(utilisateur.restaurantId) && utilisateur.restaurantId === idCommande;
}

async function creerCommande(requete, reponse) {
  const {
    restaurantId,
    plats,
    adresseLivraison,
    methodePaiement = "carte",
    paiement,
  } = requete.body;

  if (!restaurantId || !Array.isArray(plats) || plats.length === 0 || !adresseLivraison) {
    return reponse.status(400).json({ message: "Restaurant, plats et adresse sont obligatoires" });
  }

  if (!["carte", "livraison"].includes(methodePaiement)) {
    return reponse.status(400).json({ message: "Méthode de paiement invalide" });
  }

  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant || !restaurant.actif) {
    return reponse.status(404).json({ message: "Restaurant introuvable" });
  }

  // Les prix ne viennent jamais du client : ils sont relus en base.
  const identifiants = [];
  for (const ligne of plats) {
    identifiants.push(ligne.platId);
  }

  const platsDb = await Plat.find({
    _id: { $in: identifiants },
    restaurantId,
    disponible: true,
  });

  const identifiantsUniques = new Set(identifiants.map(String));
  if (platsDb.length !== identifiantsUniques.size) {
    return reponse.status(400).json({ message: "Un ou plusieurs plats sont invalides" });
  }

  const lignes = [];
  for (const ligne of plats) {
    let plat = null;
    for (const candidat of platsDb) {
      if (String(candidat._id) === String(ligne.platId)) {
        plat = candidat;
        break;
      }
    }

    const options = Array.isArray(ligne.options) ? ligne.options : [];
    const quantite = Math.max(1, Math.min(50, Number(ligne.quantite) || 1));

    lignes.push({
      platId: plat._id,
      nom: plat.nom,
      prix: calculerPrixLigne(plat, options),
      quantite,
      options,
    });
  }

  const totaux = calculerTotaux(lignes, restaurant.fraisLivraison);

  // Le paiement est traité avant l'enregistrement : une commande n'existe
  // en base que si le paiement a réussi, ou s'il est différé à la livraison.
  let etatPaiement = {
    fournisseurPaiement: "comptant",
    statutPaiement: "à payer",
    referencePaiement: null,
    datePaiement: null,
  };

  if (methodePaiement === "carte") {
    etatPaiement = await payerCommande({
      montant: totaux.total,
      carte: paiement,
      description: `Savora — commande chez ${restaurant.nom}`,
    });
  }

  let commande = await Commande.create({
    utilisateurId: requete.utilisateur.id,
    restaurantId,
    plats: lignes,
    ...totaux,
    adresseLivraison: String(adresseLivraison).trim(),
    methodePaiement,
    ...etatPaiement,
  });

  commande = await peuplerCommande(commande);
  emettreMiseAJourCommande(commande, "commande:nouvelle");

  reponse.status(201).json({ commande });
}

async function listerMesCommandes(requete, reponse) {
  const { page, taille, saut } = lirePagination(requete);
  const utilisateur = requete.utilisateur;

  let filtre = {};
  if (utilisateur.role === "client") {
    filtre = { utilisateurId: utilisateur.id };
  } else if (utilisateur.role === "livreur") {
    filtre = { livreurId: utilisateur.id };
  } else if (utilisateur.role === "restaurant") {
    if (!utilisateur.restaurantId) {
      return reponse.status(400).json({
        message: "Ce compte restaurant n'est lié à aucun restaurant",
      });
    }
    filtre = { restaurantId: utilisateur.restaurantId };
  }

  const [commandes, total] = await Promise.all([
    Commande.find(filtre)
      .populate(POPULATE_COMMANDE)
      .sort({ createdAt: -1 })
      .skip(saut)
      .limit(taille),
    Commande.countDocuments(filtre),
  ]);

  reponse.json({ commandes, pagination: { page, taille, total } });
}

async function listerCommandesDisponibles(_requete, reponse) {
  const commandes = await Commande.find({ statut: "prête", livreurId: null })
    .populate(POPULATE_COMMANDE)
    .sort({ updatedAt: 1 })
    .limit(PAGE_MAXIMUM);

  reponse.json({ commandes });
}

async function accepterLivraison(requete, reponse) {
  // findOneAndUpdate rend l'attribution atomique : deux livreurs qui appuient
  // au même instant ne peuvent pas obtenir la même commande.
  let commande = await Commande.findOneAndUpdate(
    { _id: requete.params.id, statut: "prête", livreurId: null },
    {
      $set: { livreurId: requete.utilisateur.id, statut: "prise en charge" },
      $push: {
        historiqueStatuts: {
          statut: "prise en charge",
          modifiePar: requete.utilisateur.id,
          date: new Date(),
        },
      },
    },
    { new: true, runValidators: true }
  );

  if (!commande) {
    const existe = await Commande.exists({ _id: requete.params.id });
    return reponse.status(existe ? 409 : 404).json({
      message: existe
        ? "Cette livraison a déjà été acceptée ou n'est plus disponible"
        : "Commande introuvable",
    });
  }

  commande = await peuplerCommande(commande);
  emettreMiseAJourCommande(commande, "commande:attribuee");

  reponse.json({ commande });
}

async function obtenirCommande(requete, reponse) {
  const commande = await Commande.findById(requete.params.id).populate(POPULATE_COMMANDE);
  if (!commande) return reponse.status(404).json({ message: "Commande introuvable" });

  const utilisateur = requete.utilisateur;

  if (utilisateur.role === "client") {
    const proprietaire = String(commande.utilisateurId?._id || commande.utilisateurId);
    if (proprietaire !== utilisateur.id) {
      return reponse.status(403).json({ message: "Accès interdit" });
    }
  }

  if (utilisateur.role === "livreur") {
    const livreur = commande.livreurId
      ? String(commande.livreurId._id || commande.livreurId)
      : null;
    if (livreur !== utilisateur.id) {
      return reponse.status(403).json({ message: "Accès interdit" });
    }
  }

  if (utilisateur.role === "restaurant" && !restaurantCorrespond(utilisateur, commande)) {
    return reponse.status(403).json({
      message: "Cette commande n'appartient pas à votre restaurant",
    });
  }

  reponse.json({ commande });
}

async function modifierStatut(requete, reponse) {
  const nouveauStatut = String(requete.body.statut || "");

  if (!estStatutConnu(nouveauStatut)) {
    return reponse.status(400).json({ message: "Statut invalide" });
  }

  const commande = await Commande.findById(requete.params.id);
  if (!commande) return reponse.status(404).json({ message: "Commande introuvable" });

  const utilisateur = requete.utilisateur;

  if (utilisateur.role === "restaurant" && !restaurantCorrespond(utilisateur, commande)) {
    return reponse.status(403).json({
      message: "Cette commande n'appartient pas à votre restaurant",
    });
  }

  if (utilisateur.role === "livreur") {
    const livreur = commande.livreurId ? String(commande.livreurId) : null;
    if (livreur !== utilisateur.id) {
      return reponse.status(403).json({ message: "Cette livraison ne vous est pas attribuée" });
    }
  }

  if (!roleAutorise(utilisateur.role, nouveauStatut)) {
    return reponse.status(403).json({
      message: `Le rôle « ${utilisateur.role} » ne peut pas poser le statut « ${nouveauStatut} »`,
    });
  }

  if (!transitionAutorisee(commande.statut, nouveauStatut)) {
    return reponse.status(409).json({
      message: `Transition impossible : ${commande.statut} → ${nouveauStatut}`,
    });
  }

  commande.statut = nouveauStatut;
  commande.historiqueStatuts.push({ statut: nouveauStatut, modifiePar: utilisateur.id });

  // Une commande payée à la livraison est encaissée à la remise du repas.
  if (nouveauStatut === "livrée" && commande.methodePaiement === "livraison") {
    commande.statutPaiement = "payé";
    commande.datePaiement = new Date();
  }

  await commande.save();
  await peuplerCommande(commande);

  emettreMiseAJourCommande(commande);
  reponse.json({ commande });
}

module.exports = {
  creerCommande,
  listerMesCommandes,
  listerCommandesDisponibles,
  accepterLivraison,
  obtenirCommande,
  modifierStatut,
  POPULATE_COMMANDE,
};
