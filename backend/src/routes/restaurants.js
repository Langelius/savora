const express = require("express");

const asynchrone = require("../utils/asynchrone");
const controleur = require("../controllers/restaurantsController");

const routeur = express.Router();

// Routes publiques : parcourir le catalogue ne demande pas de compte.
routeur.get("/", asynchrone(controleur.listerRestaurants));
routeur.get("/:id", asynchrone(controleur.obtenirRestaurant));
routeur.get("/:id/avis", asynchrone(controleur.listerAvisRestaurant));

module.exports = routeur;
