const express = require("express");

const verifierJeton = require("../middleware/auth");
const autoriserRoles = require("../middleware/roles");
const asynchrone = require("../utils/asynchrone");
const controleurAdmin = require("../controllers/adminController");
const menu = require("../controllers/menuController");

const routeur = express.Router();

// Tout l'espace d'administration est protégé par ces deux barrières :
// un jeton valide, puis le rôle « admin ». Le middleware admin.js dédié a été
// supprimé au profit de autoriserRoles, qui couvrait déjà le même besoin.
routeur.use(asynchrone(verifierJeton));
routeur.use(autoriserRoles("admin"));

routeur.get("/statistiques", asynchrone(controleurAdmin.obtenirStatistiques));

routeur.get("/utilisateurs", asynchrone(controleurAdmin.obtenirUtilisateurs));
routeur.patch("/utilisateurs/:id/role", asynchrone(controleurAdmin.modifierRoleUtilisateur));
routeur.delete("/utilisateurs/:id", asynchrone(controleurAdmin.supprimerUtilisateur));

routeur.get("/restaurants", asynchrone(controleurAdmin.obtenirRestaurants));
routeur.post("/restaurants", asynchrone(menu.creerRestaurant));
routeur.put("/restaurants/:id", asynchrone(menu.modifierRestaurant));
routeur.patch("/restaurants/:id/actif", asynchrone(controleurAdmin.modifierEtatRestaurant));
routeur.delete("/restaurants/:id", asynchrone(controleurAdmin.supprimerRestaurant));

// Menu d'un restaurant, vu par l'administration.
routeur.get("/restaurants/:restaurantId/plats", asynchrone(menu.listerPlats));
routeur.post("/restaurants/:restaurantId/plats", asynchrone(menu.creerPlat));
routeur.put("/plats/:platId", asynchrone(menu.modifierPlat));
routeur.delete("/plats/:platId", asynchrone(menu.supprimerPlat));

routeur.get("/commandes", asynchrone(controleurAdmin.obtenirCommandes));
routeur.patch("/commandes/:id/annuler", asynchrone(controleurAdmin.annulerCommande));

module.exports = routeur;
