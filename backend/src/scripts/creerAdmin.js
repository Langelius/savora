const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");

const Utilisateur = require("../models/Utilisateur");

dotenv.config();

async function creerAdmin() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error(
        "La variable MONGODB_URI est absente du fichier .env."
      );
    }

    await mongoose.connect(process.env.MONGODB_URI);

    const courriel = "admin@savora.ca";
    const motDePasse = "Savora123!";

    const motDePasseHache = await bcrypt.hash(
      motDePasse,
      10
    );

    const adminExistant = await Utilisateur.findOne({
      courriel,
    });

    if (adminExistant) {
      adminExistant.nom = "Administrateur Savora";
      adminExistant.role = "admin";
      adminExistant.motDePasse = motDePasseHache;
      adminExistant.restaurantId = null;

      await adminExistant.save();

      console.log(
        "Le compte existant a été transformé en administrateur."
      );
    } else {
      await Utilisateur.create({
        nom: "Administrateur Savora",
        courriel,
        motDePasse: motDePasseHache,
        role: "admin",
        telephone: "0000000000",
        restaurantId: null,
      });

      console.log(
        "Compte administrateur créé avec succès."
      );
    }

    console.log("Courriel :", courriel);
    console.log("Mot de passe :", motDePasse);
  } catch (erreur) {
    console.error(
      "Erreur lors de la création de l'administrateur :",
      erreur.message
    );
  } finally {
    await mongoose.disconnect();
  }
}

creerAdmin();