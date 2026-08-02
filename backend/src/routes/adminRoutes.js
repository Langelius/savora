const express = require("express");

const verifierJeton = require("../middleware/auth");
const verifierAdmin = require("../middleware/admin");

const controleurAdmin = require(
  "../controllers/adminController"
);

const routeur = express.Router();

routeur.use(verifierJeton);
routeur.use(verifierAdmin);

routeur.get(
  "/statistiques",
  controleurAdmin.obtenirStatistiques
);

routeur.get(
  "/utilisateurs",
  controleurAdmin.obtenirUtilisateurs
);

routeur.patch(
  "/utilisateurs/:id/role",
  controleurAdmin.modifierRoleUtilisateur
);

routeur.delete(
  "/utilisateurs/:id",
  controleurAdmin.supprimerUtilisateur
);

routeur.get(
  "/restaurants",
  controleurAdmin.obtenirRestaurants
);

routeur.patch(
  "/restaurants/:id/actif",
  controleurAdmin.modifierEtatRestaurant
);

routeur.delete(
  "/restaurants/:id",
  controleurAdmin.supprimerRestaurant
);

routeur.get(
  "/commandes",
  controleurAdmin.obtenirCommandes
);

routeur.patch(
  "/commandes/:id/annuler",
  controleurAdmin.annulerCommande
);

module.exports = routeur;