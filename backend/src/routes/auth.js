// Routes d'authentification
const express = require("express");
const routeur = express.Router();
const verifierJeton = require("../middleware/auth");
const controleurAuth = require("../controllers/authController");

routeur.post("/inscription", controleurAuth.inscription);
routeur.post("/connexion", controleurAuth.connexion);
routeur.get("/profil", verifierJeton, controleurAuth.obtenirProfil);
routeur.put("/profil", verifierJeton, controleurAuth.modifierProfil);
routeur.post("/mot-de-passe-oublie", controleurAuth.motDePasseOublie);
routeur.post("/reinitialisation", controleurAuth.reinitialiserMotDePasse);

module.exports = routeur;
