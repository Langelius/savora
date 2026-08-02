// Règles de calcul du prix d'une commande.
//
// Cette logique est isolée dans un service pur (sans base de données ni
// requête HTTP) pour deux raisons : elle est testable unitairement, et elle
// n'existe qu'à un seul endroit. Auparavant le taux de taxes était écrit en
// dur à la fois dans le contrôleur et dans l'écran de paiement mobile.

const { environnement } = require("../config/environnement");

// Arrondit à deux décimales en évitant les surprises des flottants
// (0.1 + 0.2 = 0.30000000000000004).
function arrondirMontant(valeur) {
  return Math.round((Number(valeur) + Number.EPSILON) * 100) / 100;
}

// Prix unitaire d'une ligne : prix de base + suppléments des options choisies.
function calculerPrixLigne(plat, optionsChoisies) {
  let prix = Number(plat.prix);

  const disponibles = Array.isArray(plat.options) ? plat.options : [];
  const choisies = Array.isArray(optionsChoisies) ? optionsChoisies : [];

  for (const nomOption of choisies) {
    for (const option of disponibles) {
      if (option.nom === nomOption) {
        prix += Number(option.prix) || 0;
        break;
      }
    }
  }

  return arrondirMontant(prix);
}

// Calcule le détail complet d'une commande à partir de ses lignes.
function calculerTotaux(lignes, fraisLivraison = 0, tauxTaxes = environnement.TAUX_TAXES) {
  let sousTotal = 0;
  for (const ligne of lignes) {
    sousTotal += Number(ligne.prix) * Number(ligne.quantite);
  }

  sousTotal = arrondirMontant(sousTotal);
  const frais = arrondirMontant(fraisLivraison);
  const taxes = arrondirMontant(sousTotal * tauxTaxes);
  const total = arrondirMontant(sousTotal + frais + taxes);

  return { sousTotal, fraisLivraison: frais, taxes, total };
}

module.exports = { arrondirMontant, calculerPrixLigne, calculerTotaux };
