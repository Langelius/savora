// Connexion à MongoDB via Mongoose
const mongoose = require("mongoose");

async function connecterBaseDeDonnees() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connexion à MongoDB réussie");
  } catch (erreur) {
    console.error("Erreur de connexion à MongoDB :", erreur.message);
    process.exit(1);
  }
}

module.exports = connecterBaseDeDonnees;
