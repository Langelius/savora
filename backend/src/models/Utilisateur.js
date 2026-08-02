const mongoose = require("mongoose");

const ROLES = ["client", "restaurant", "livreur", "admin"];

const schemaAdresse = new mongoose.Schema(
  {
    libelle: { type: String, default: "Maison", trim: true },
    adresse: { type: String, trim: true },
    ville: { type: String, trim: true },
    codePostal: { type: String, trim: true },
  },
  { _id: false }
);

const schemaUtilisateur = new mongoose.Schema(
  {
    nom: { type: String, required: true, trim: true, minlength: 2 },
    courriel: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    // select: false → le hachage n'est jamais renvoyé par erreur dans une réponse.
    motDePasse: { type: String, required: true, select: false },
    telephone: { type: String, default: "", trim: true },
    adresses: { type: [schemaAdresse], default: [] },
    role: { type: String, enum: ROLES, default: "client", index: true },
    // Renseigné uniquement pour les comptes de rôle « restaurant ».
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      default: null,
      index: true,
    },
    jetonReinitialisation: { type: String, select: false },
    expirationJetonReinitialisation: { type: Date, select: false },
  },
  { timestamps: true }
);

schemaUtilisateur.statics.ROLES = ROLES;

module.exports = mongoose.model("Utilisateur", schemaUtilisateur);
