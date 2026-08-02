const mongoose = require("mongoose");

const schemaRestaurant = new mongoose.Schema(
  {
    nom: { type: String, required: true, trim: true, index: true },
    cuisine: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    image: { type: String, required: true },
    // Adresse du commerce : utilisée par l'écran de carte et par le populate
    // des commandes. Elle était référencée par le code sans exister au schéma.
    adresse: { type: String, default: "", trim: true },
    // Note moyenne recalculée à chaque nouvel avis (voir avisController).
    note: { type: Number, min: 0, max: 5, default: 0 },
    nombreAvis: { type: Number, min: 0, default: 0 },
    delai: { type: String, default: "25–35 min" },
    fraisLivraison: { type: Number, min: 0, default: 0 },
    actif: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Restaurant", schemaRestaurant);
