const mongoose = require("mongoose");

const Utilisateur = require("../models/Utilisateur");
const Restaurant = require("../models/Restaurant");
const Commande = require("../models/Commande");
const {
  emettreMiseAJourCommande,
} = require("../config/socket");
const { construireRecherche } = require("../utils/texte");

async function obtenirStatistiques(req, res) {
  try {
    const [
      nombreUtilisateurs,
      nombreClients,
      nombreLivreurs,
      nombreAdministrateurs,
      nombreRestaurants,
      restaurantsActifs,
      nombreCommandes,
      commandesEnAttente,
      commandesEnPreparation,
      commandesEnRoute,
      commandesLivrees,
      commandesAnnulees,
      revenus,
    ] = await Promise.all([
      Utilisateur.countDocuments(),
      Utilisateur.countDocuments({ role: "client" }),
      Utilisateur.countDocuments({ role: "livreur" }),
      Utilisateur.countDocuments({ role: "admin" }),

      Restaurant.countDocuments(),
      Restaurant.countDocuments({ actif: true }),

      Commande.countDocuments(),
      Commande.countDocuments({ statut: "en attente" }),
      Commande.countDocuments({
        statut: {
          $in: [
            "confirmée",
            "en préparation",
            "prête",
            "prise en charge",
          ],
        },
      }),
      Commande.countDocuments({ statut: "en route" }),
      Commande.countDocuments({ statut: "livrée" }),
      Commande.countDocuments({ statut: "annulée" }),

      Commande.aggregate([
        {
          $match: {
            statut: "livrée",
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: "$total",
            },
          },
        },
      ]),
    ]);

    const revenusTotaux =
      revenus.length > 0 ? revenus[0].total : 0;

    return res.status(200).json({
      statistiques: {
        utilisateurs: {
          total: nombreUtilisateurs,
          clients: nombreClients,
          livreurs: nombreLivreurs,
          administrateurs: nombreAdministrateurs,
        },

        restaurants: {
          total: nombreRestaurants,
          actifs: restaurantsActifs,
          inactifs: nombreRestaurants - restaurantsActifs,
        },

        commandes: {
          total: nombreCommandes,
          enAttente: commandesEnAttente,
          enPreparation: commandesEnPreparation,
          enRoute: commandesEnRoute,
          livrees: commandesLivrees,
          annulees: commandesAnnulees,
        },

        revenusTotaux,
      },
    });
  } catch (erreur) {
    console.error(
      "Erreur statistiques administrateur :",
      erreur
    );

    return res.status(500).json({
      message:
        "Impossible de récupérer les statistiques.",
    });
  }
}

async function obtenirUtilisateurs(req, res) {
  try {
    const {
      role,
      recherche = "",
    } = req.query;

    const filtre = {};

    if (
      role &&
      ["client", "restaurant", "livreur", "admin"].includes(role)
    ) {
      filtre.role = role;
    }

    // La saisie est échappée avant d'entrer dans un $regex : sans cela, une
    // saisie comme « (a+)+$ » provoque un déni de service par ReDoS.
    const filtreRecherche = construireRecherche(recherche, ["nom", "courriel"]);
    if (filtreRecherche) {
      Object.assign(filtre, filtreRecherche);
    }

    const utilisateurs = await Utilisateur.find(filtre)
      .select("-motDePasse")
      .populate("restaurantId", "nom cuisine actif")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      utilisateurs,
    });
  } catch (erreur) {
    console.error(
      "Erreur récupération utilisateurs :",
      erreur
    );

    return res.status(500).json({
      message:
        "Impossible de récupérer les utilisateurs.",
    });
  }
}

async function modifierRoleUtilisateur(req, res) {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const rolesAutorises = [
      "client",
      "restaurant",
      "livreur",
      "admin",
    ];

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Identifiant utilisateur invalide.",
      });
    }

    if (!rolesAutorises.includes(role)) {
      return res.status(400).json({
        message: "Rôle invalide.",
      });
    }

    const utilisateur = await Utilisateur.findById(id);

    if (!utilisateur) {
      return res.status(404).json({
        message: "Utilisateur introuvable.",
      });
    }

    utilisateur.role = role;

    if (role !== "restaurant") {
      utilisateur.restaurantId = null;
    }

    await utilisateur.save();

    const utilisateurModifie =
      await Utilisateur.findById(id)
        .select("-motDePasse")
        .populate(
          "restaurantId",
          "nom cuisine actif"
        );

    return res.status(200).json({
      message: "Rôle modifié avec succès.",
      utilisateur: utilisateurModifie,
    });
  } catch (erreur) {
    console.error(
      "Erreur modification rôle :",
      erreur
    );

    return res.status(500).json({
      message:
        "Impossible de modifier le rôle.",
    });
  }
}

async function supprimerUtilisateur(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Identifiant utilisateur invalide.",
      });
    }

    if (
      req.utilisateur.id === id ||
      req.utilisateur._id?.toString() === id
    ) {
      return res.status(400).json({
        message:
          "Un administrateur ne peut pas supprimer son propre compte.",
      });
    }

    const utilisateur =
      await Utilisateur.findById(id);

    if (!utilisateur) {
      return res.status(404).json({
        message: "Utilisateur introuvable.",
      });
    }

    const commandeActive =
      await Commande.findOne({
        $or: [
          { utilisateurId: id },
          { livreurId: id },
        ],
        statut: {
          $nin: ["livrée", "annulée"],
        },
      });

    if (commandeActive) {
      return res.status(409).json({
        message:
          "Cet utilisateur possède une commande active.",
      });
    }

    await Utilisateur.findByIdAndDelete(id);

    return res.status(200).json({
      message: "Utilisateur supprimé.",
    });
  } catch (erreur) {
    console.error(
      "Erreur suppression utilisateur :",
      erreur
    );

    return res.status(500).json({
      message:
        "Impossible de supprimer l’utilisateur.",
    });
  }
}

async function obtenirRestaurants(req, res) {
  try {
    const {
      actif,
      recherche = "",
    } = req.query;

    const filtre = {};

    if (actif === "true") {
      filtre.actif = true;
    }

    if (actif === "false") {
      filtre.actif = false;
    }

    const filtreRecherche = construireRecherche(recherche, ["nom", "cuisine"]);
    if (filtreRecherche) {
      Object.assign(filtre, filtreRecherche);
    }

    const restaurants = await Restaurant.find(
      filtre
    ).sort({ createdAt: -1 });

    return res.status(200).json({
      restaurants,
    });
  } catch (erreur) {
    console.error(
      "Erreur récupération restaurants :",
      erreur
    );

    return res.status(500).json({
      message:
        "Impossible de récupérer les restaurants.",
    });
  }
}

async function modifierEtatRestaurant(req, res) {
  try {
    const { id } = req.params;
    const { actif } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Identifiant restaurant invalide.",
      });
    }

    if (typeof actif !== "boolean") {
      return res.status(400).json({
        message:
          "La propriété actif doit être un booléen.",
      });
    }

    const restaurant =
      await Restaurant.findByIdAndUpdate(
        id,
        { actif },
        {
          new: true,
          runValidators: true,
        }
      );

    if (!restaurant) {
      return res.status(404).json({
        message: "Restaurant introuvable.",
      });
    }

    return res.status(200).json({
      message: actif
        ? "Restaurant activé."
        : "Restaurant désactivé.",
      restaurant,
    });
  } catch (erreur) {
    console.error(
      "Erreur modification restaurant :",
      erreur
    );

    return res.status(500).json({
      message:
        "Impossible de modifier le restaurant.",
    });
  }
}

async function supprimerRestaurant(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Identifiant restaurant invalide.",
      });
    }

    const commandeActive =
      await Commande.findOne({
        restaurantId: id,
        statut: {
          $nin: ["livrée", "annulée"],
        },
      });

    if (commandeActive) {
      return res.status(409).json({
        message:
          "Ce restaurant possède une commande active.",
      });
    }

    const restaurant =
      await Restaurant.findByIdAndDelete(id);

    if (!restaurant) {
      return res.status(404).json({
        message: "Restaurant introuvable.",
      });
    }

    await Utilisateur.updateMany(
      { restaurantId: id },
      {
        $set: {
          restaurantId: null,
          role: "client",
        },
      }
    );

    return res.status(200).json({
      message: "Restaurant supprimé.",
    });
  } catch (erreur) {
    console.error(
      "Erreur suppression restaurant :",
      erreur
    );

    return res.status(500).json({
      message:
        "Impossible de supprimer le restaurant.",
    });
  }
}

async function obtenirCommandes(req, res) {
  try {
    const {
      statut,
      restaurantId,
      livreurId,
    } = req.query;

    const filtre = {};

    if (
      statut &&
      Commande.STATUTS.includes(statut)
    ) {
      filtre.statut = statut;
    }

    if (
      restaurantId &&
      mongoose.Types.ObjectId.isValid(
        restaurantId
      )
    ) {
      filtre.restaurantId = restaurantId;
    }

    if (
      livreurId &&
      mongoose.Types.ObjectId.isValid(
        livreurId
      )
    ) {
      filtre.livreurId = livreurId;
    }

    const commandes = await Commande.find(
      filtre
    )
      .populate(
        "utilisateurId",
        "nom courriel telephone"
      )
      .populate(
        "restaurantId",
        "nom cuisine image"
      )
      .populate(
        "livreurId",
        "nom courriel telephone"
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      commandes,
    });
  } catch (erreur) {
    console.error(
      "Erreur récupération commandes :",
      erreur
    );

    return res.status(500).json({
      message:
        "Impossible de récupérer les commandes.",
    });
  }
}

async function annulerCommande(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Identifiant commande invalide.",
      });
    }

    const commande = await Commande.findById(
      id
    );

    if (!commande) {
      return res.status(404).json({
        message: "Commande introuvable.",
      });
    }

    if (commande.statut === "livrée") {
      return res.status(409).json({
        message:
          "Une commande livrée ne peut pas être annulée.",
      });
    }

    if (commande.statut === "annulée") {
      return res.status(409).json({
        message:
          "Cette commande est déjà annulée.",
      });
    }

    commande.statut = "annulée";

    commande.historiqueStatuts.push({
      statut: "annulée",
      modifiePar:
        req.utilisateur.id ??
        req.utilisateur._id,
    });

    await commande.save();

    const commandeModifiee =
      await Commande.findById(id)
        .populate(
          "utilisateurId",
          "nom courriel telephone"
        )
        .populate(
          "restaurantId",
          "nom cuisine image"
        )
        .populate(
          "livreurId",
          "nom courriel telephone"
        );

   emettreMiseAJourCommande(
  commandeModifiee,
  "commande:mise-a-jour"
);
    return res.status(200).json({
      message: "Commande annulée.",
      commande: commandeModifiee,
    });
  } catch (erreur) {
    console.error(
      "Erreur annulation commande :",
      erreur
    );

    return res.status(500).json({
      message:
        "Impossible d’annuler la commande.",
    });
  }
}

module.exports = {
  obtenirStatistiques,
  obtenirUtilisateurs,
  modifierRoleUtilisateur,
  supprimerUtilisateur,
  obtenirRestaurants,
  modifierEtatRestaurant,
  supprimerRestaurant,
  obtenirCommandes,
  annulerCommande,
};