require("dotenv").config();
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const connecterDB = require("../config/db");
const Utilisateur = require("../models/Utilisateur");

async function executer() {
  const courriel = String(process.env.COURRIEL_LIVREUR || "livreur@savora.ca").trim().toLowerCase();
  const motDePasse = String(process.env.MOT_DE_PASSE_LIVREUR || "Savora123!");
  const nom = String(process.env.NOM_LIVREUR || "Livreur Savora").trim();
  const telephone = String(process.env.TELEPHONE_LIVREUR || "").trim();

  if (motDePasse.length < 8) throw new Error("Le mot de passe livreur doit contenir au moins 8 caractères");
  await connecterDB();
  const motDePasseHache = await bcrypt.hash(motDePasse, 12);
  const utilisateur = await Utilisateur.findOneAndUpdate(
    { courriel },
    { nom, courriel, motDePasse: motDePasseHache, telephone, role: "livreur", restaurantId: null },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
  console.log(`Compte livreur prêt : ${utilisateur.courriel} → ${utilisateur.nom}`);
}

executer().catch((erreur) => {
  console.error("Création impossible :", erreur.message);
  process.exitCode = 1;
}).finally(async () => mongoose.connection.close());
