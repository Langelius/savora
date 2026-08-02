const mongoose = require("mongoose");

const { STATUTS } = require("../services/statutsCommande");

// Ligne de commande : le nom et le prix sont recopiés au moment de l'achat.
// Si le restaurant change ensuite son menu, la commande garde le prix payé.
const schemaLigne = new mongoose.Schema(
  {
    platId: { type: mongoose.Schema.Types.ObjectId, ref: "Plat", required: true },
    nom: { type: String, required: true },
    prix: { type: Number, required: true },
    quantite: { type: Number, required: true, min: 1, default: 1 },
    options: { type: [String], default: [] },
  },
  { _id: false }
);

const schemaHistorique = new mongoose.Schema(
  {
    statut: { type: String, enum: STATUTS, required: true },
    date: { type: Date, default: Date.now },
    modifiePar: { type: mongoose.Schema.Types.ObjectId, ref: "Utilisateur" },
  },
  { _id: false }
);

const schemaCommande = new mongoose.Schema(
  {
    utilisateurId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Utilisateur",
      required: true,
      index: true,
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },
    livreurId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Utilisateur",
      default: null,
      index: true,
    },
    plats: { type: [schemaLigne], default: [] },

    sousTotal: { type: Number, required: true, min: 0 },
    fraisLivraison: { type: Number, required: true, min: 0, default: 0 },
    taxes: { type: Number, required: true, min: 0, default: 0 },
    total: { type: Number, required: true, min: 0 },

    statut: { type: String, enum: STATUTS, default: "en attente", index: true },
    historiqueStatuts: { type: [schemaHistorique], default: [] },

    adresseLivraison: { type: String, required: true },

    methodePaiement: { type: String, enum: ["carte", "livraison"], default: "carte" },
    // « stripe » en mode test, « simulation » hors ligne, « comptant » à la livraison.
    fournisseurPaiement: {
      type: String,
      enum: ["stripe", "simulation", "comptant"],
      default: "comptant",
    },
    statutPaiement: {
      type: String,
      enum: ["en attente", "payé", "à payer", "échoué", "remboursé"],
      default: "en attente",
      index: true,
    },
    referencePaiement: { type: String, default: null },
    datePaiement: { type: Date, default: null },

    // Renseigné par le contrôleur d'avis : évite une requête supplémentaire
    // pour savoir si le bouton « Noter » doit être affiché.
    avisDepose: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Index composé : liste des commandes d'un client, de la plus récente
// à la plus ancienne — c'est la requête la plus fréquente de l'application.
schemaCommande.index({ utilisateurId: 1, createdAt: -1 });
schemaCommande.index({ restaurantId: 1, createdAt: -1 });
// Recherche des livraisons disponibles par le tableau de bord livreur.
schemaCommande.index({ statut: 1, livreurId: 1 });

schemaCommande.pre("save", function initialiserHistorique(suivant) {
  if (this.isNew && this.historiqueStatuts.length === 0) {
    this.historiqueStatuts.push({ statut: this.statut, modifiePar: this.utilisateurId });
  }
  suivant();
});

schemaCommande.statics.STATUTS = STATUTS;

module.exports = mongoose.model("Commande", schemaCommande);
