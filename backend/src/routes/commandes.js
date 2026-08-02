const express = require("express");
const routeur = express.Router();
const verifierJeton = require("../middleware/auth");
const autoriserRoles = require("../middleware/roles");
const controleur = require("../controllers/commandesController");

routeur.use(verifierJeton);
routeur.get("/", controleur.listerMesCommandes);
routeur.get("/disponibles", autoriserRoles("livreur", "admin"), controleur.listerCommandesDisponibles);
routeur.post("/", autoriserRoles("client"), controleur.creerCommande);
routeur.patch("/:id/accepter", autoriserRoles("livreur"), controleur.accepterLivraison);
routeur.get("/:id", controleur.obtenirCommande);
routeur.patch("/:id/statut", autoriserRoles("restaurant", "livreur", "admin"), controleur.modifierStatut);

module.exports = routeur;
