// Routes d'authentification.
const express = require("express");

const verifierJeton = require("../middleware/auth");
const asynchrone = require("../utils/asynchrone");
const { limiteurRequetes } = require("../middleware/securite");
const controleurAuth = require("../controllers/authController");

const routeur = express.Router();

// Freine les attaques par force brute sur les routes sensibles.
const limiteurConnexion = limiteurRequetes({
  fenetreMs: 15 * 60 * 1000,
  maximum: 10,
  message: "Trop de tentatives de connexion. Réessaie dans quelques minutes.",
});

const limiteurInscription = limiteurRequetes({
  fenetreMs: 60 * 60 * 1000,
  maximum: 20,
  message: "Trop de comptes créés depuis cette adresse. Réessaie plus tard.",
});

routeur.post("/inscription", limiteurInscription, asynchrone(controleurAuth.inscription));
routeur.post("/connexion", limiteurConnexion, asynchrone(controleurAuth.connexion));

routeur.get("/profil", asynchrone(verifierJeton), asynchrone(controleurAuth.obtenirProfil));
routeur.put("/profil", asynchrone(verifierJeton), asynchrone(controleurAuth.modifierProfil));

routeur.post("/mot-de-passe-oublie", limiteurConnexion, asynchrone(controleurAuth.motDePasseOublie));
routeur.post("/reinitialisation", limiteurConnexion, asynchrone(controleurAuth.reinitialiserMotDePasse));

module.exports = routeur;
