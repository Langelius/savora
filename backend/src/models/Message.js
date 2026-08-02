const mongoose = require("mongoose");

const schemaMessage = new mongoose.Schema({
  commandeId: { type: mongoose.Schema.Types.ObjectId, ref: "Commande", required: true, index: true },
  auteurId: { type: mongoose.Schema.Types.ObjectId, ref: "Utilisateur", required: true },
  texte: { type: String, required: true, trim: true, maxlength: 1000 },
}, { timestamps: true });

module.exports = mongoose.model("Message", schemaMessage);
