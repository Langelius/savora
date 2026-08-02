const express = require("express");

const verifierJeton = require("../middleware/auth");
const asynchrone = require("../utils/asynchrone");
const controleur = require("../controllers/messagesController");

const routeur = express.Router();

routeur.use(asynchrone(verifierJeton));

routeur.get("/:id/messages", asynchrone(controleur.listerMessages));
routeur.post("/:id/messages", asynchrone(controleur.envoyerMessage));

module.exports = routeur;
