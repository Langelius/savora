const mongoose = require("mongoose");

// Option de personnalisation d'un plat (supplément, taille, sauce...).
// Le prix est un supplément ajouté au prix de base du plat.
const schemaOption = new mongoose.Schema(
  {
    nom: { type: String, required: true, trim: true },
    prix: { type: Number, required: true, min: 0, default: 0 },
  },
  { _id: false }
);

const schemaPlat = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },
    nom: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    prix: { type: Number, required: true, min: 0 },
    categorie: { type: String, required: true },
    image: { type: String, required: true },
    options: { type: [schemaOption], default: [] },
    populaire: { type: Boolean, default: false },
    disponible: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Plat", schemaPlat);
