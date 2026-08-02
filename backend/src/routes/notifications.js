const express = require("express");

const verifierJeton = require("../middleware/auth");
const asynchrone = require("../utils/asynchrone");
const controleur = require("../controllers/notificationsController");

const routeur = express.Router();

routeur.use(asynchrone(verifierJeton));

routeur.post("/appareil", asynchrone(controleur.enregistrerAppareil));
routeur.delete("/appareil", asynchrone(controleur.oublierAppareil));

module.exports = routeur;
