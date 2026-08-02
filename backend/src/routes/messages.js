const express = require("express");
const routeur = express.Router();
const verifierJeton = require("../middleware/auth");
const controleur = require("../controllers/messagesController");

routeur.use(verifierJeton);
routeur.get("/:id/messages", controleur.listerMessages);
routeur.post("/:id/messages", controleur.envoyerMessage);

module.exports = routeur;
