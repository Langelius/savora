const express = require("express");

const verifierJeton = require("../middleware/auth");
const autoriserRoles = require("../middleware/roles");
const asynchrone = require("../utils/asynchrone");
const controleur = require("../controllers/commandesController");
const controleurAvis = require("../controllers/avisController");

const routeur = express.Router();

routeur.use(asynchrone(verifierJeton));

routeur.get("/", asynchrone(controleur.listerMesCommandes));
routeur.get(
  "/disponibles",
  autoriserRoles("livreur", "admin"),
  asynchrone(controleur.listerCommandesDisponibles)
);

routeur.post("/", autoriserRoles("client"), asynchrone(controleur.creerCommande));
routeur.patch("/:id/accepter", autoriserRoles("livreur"), asynchrone(controleur.accepterLivraison));

routeur.get("/:id", asynchrone(controleur.obtenirCommande));
routeur.patch(
  "/:id/statut",
  autoriserRoles("restaurant", "livreur", "admin"),
  asynchrone(controleur.modifierStatut)
);

// Notation du restaurant après livraison (fonctionnalité 4 du cahier des charges).
routeur.get("/:id/avis", asynchrone(controleurAvis.obtenirAvisCommande));
routeur.post("/:id/avis", autoriserRoles("client"), asynchrone(controleurAvis.deposerAvis));

module.exports = routeur;
