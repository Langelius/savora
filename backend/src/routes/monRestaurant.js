const express = require("express");

const verifierJeton = require("../middleware/auth");
const autoriserRoles = require("../middleware/roles");
const asynchrone = require("../utils/asynchrone");
const menu = require("../controllers/menuController");

const routeur = express.Router();

// Espace du gestionnaire : il n'indique jamais quel restaurant il gère,
// c'est son compte qui le détermine. Aucun identifiant à falsifier.
routeur.use(asynchrone(verifierJeton));
routeur.use(autoriserRoles("restaurant"));

routeur.get("/", asynchrone(menu.obtenirMonRestaurant));
routeur.put("/", asynchrone(menu.modifierRestaurant));

routeur.get("/plats", asynchrone(menu.listerPlats));
routeur.post("/plats", asynchrone(menu.creerPlat));
routeur.put("/plats/:platId", asynchrone(menu.modifierPlat));
routeur.delete("/plats/:platId", asynchrone(menu.supprimerPlat));

module.exports = routeur;
