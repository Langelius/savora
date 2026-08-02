const mongoose = require("mongoose");

const STATUTS = [
  "en attente",
  "confirmée",
  "en préparation",
  "prête",
  "prise en charge",
  "en route",
  "livrée",
  "annulée",
];

const schemaCommande = new mongoose.Schema({
  utilisateurId: { type: mongoose.Schema.Types.ObjectId, ref: "Utilisateur", required: true, index: true },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
  livreurId: { type: mongoose.Schema.Types.ObjectId, ref: "Utilisateur", default: null, index: true },
  plats: [{
    platId: { type: mongoose.Schema.Types.ObjectId, ref: "Plat", required: true },
    nom: { type: String, required: true },
    prix: { type: Number, required: true },
    quantite: { type: Number, required: true, min: 1, default: 1 },
    options: [String],
  }],
  sousTotal: { type: Number, required: true, min: 0 },
  fraisLivraison: { type: Number, required: true, min: 0, default: 0 },
  taxes: { type: Number, required: true, min: 0, default: 0 },
  total: { type: Number, required: true, min: 0 },
  statut: { type: String, enum: STATUTS, default: "en attente", index: true },
  historiqueStatuts: [{
    statut: { type: String, enum: STATUTS, required: true },
    date: { type: Date, default: Date.now },
    modifiePar: { type: mongoose.Schema.Types.ObjectId, ref: "Utilisateur" },
  }],
  adresseLivraison: { type: String, required: true },
  methodePaiement: { type: String, enum: ["carte", "livraison"], default: "carte" },
  statutPaiement: { type: String, enum: ["en attente", "payé", "à payer", "échoué", "remboursé"], default: "en attente", index: true },
  referencePaiement: { type: String, default: null },
  datePaiement: { type: Date, default: null },
}, { timestamps: true });

schemaCommande.pre("save", function prochain(next) {
  if (this.isNew && this.historiqueStatuts.length === 0) {
    this.historiqueStatuts.push({ statut: this.statut, modifiePar: this.utilisateurId });
  }
  next();
});

schemaCommande.statics.STATUTS = STATUTS;
module.exports = mongoose.model("Commande", schemaCommande);
