// Connexion à MongoDB via Mongoose.
const mongoose = require("mongoose");

const { environnement } = require("./environnement");

async function connecterBaseDeDonnees() {
  // Échoue vite si le serveur MongoDB n'est pas joignable, plutôt que
  // de laisser les requêtes s'accumuler pendant 30 secondes.
  await mongoose.connect(environnement.uriMongo, { serverSelectionTimeoutMS: 8000 });
  console.log("Connexion à MongoDB réussie");

  mongoose.connection.on("error", (erreur) => {
    console.error("Erreur MongoDB :", erreur.message);
  });

  return mongoose.connection;
}

module.exports = connecterBaseDeDonnees;
