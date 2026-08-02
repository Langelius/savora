const mongoose = require("mongoose");

const schemaAvis = new mongoose.Schema(
  {
    // Index unique : une commande livrée ne peut être notée qu'une seule fois.
    // La contrainte est portée par la base, pas seulement par le contrôleur.
    commandeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Commande",
      required: true,
      unique: true,
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },
    utilisateurId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Utilisateur",
      required: true,
      index: true,
    },
    note: { type: Number, required: true, min: 1, max: 5 },
    commentaire: { type: String, default: "", trim: true, maxlength: 600 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Avis", schemaAvis);
