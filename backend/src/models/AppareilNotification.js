const mongoose = require("mongoose");

// Jeton de notification poussée d'un appareil.
//
// Un utilisateur peut se connecter depuis plusieurs appareils : la relation
// est donc de un à plusieurs. La clé unique est le jeton lui-même, pour qu'un
// même appareil réutilisé par un autre compte soit simplement réattribué.
const schemaAppareil = new mongoose.Schema(
  {
    utilisateurId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Utilisateur",
      required: true,
      index: true,
    },
    jeton: { type: String, required: true, unique: true, trim: true },
    plateforme: { type: String, enum: ["ios", "android", "web", "inconnue"], default: "inconnue" },
    derniereUtilisation: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AppareilNotification", schemaAppareil);
