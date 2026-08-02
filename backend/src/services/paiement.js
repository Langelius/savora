// Service de paiement.
//
// Deux modes, choisis automatiquement selon la configuration :
//
//  1. « stripe »     — STRIPE_SECRET_KEY (sk_test_...) est présente. Le serveur
//                      crée et confirme un PaymentIntent en mode test. Aucune
//                      transaction réelle n'est possible avec une clé de test.
//  2. « simulation » — aucune clé configurée. Le serveur valide le format des
//                      informations de carte et génère une référence factice,
//                      afin que la démonstration fonctionne hors ligne.
//
// Dans les deux cas, aucun numéro de carte n'est stocké en base : seules la
// référence de transaction et la date de paiement sont conservées.

const { environnement } = require("../config/environnement");

// Moyens de paiement de test fournis par Stripe. Le numéro saisi par
// l'utilisateur sert uniquement à choisir le scénario à rejouer ; il n'est
// jamais transmis tel quel, ce qui évite toute exigence PCI-DSS côté serveur.
const CARTES_DE_TEST = {
  "4242424242424242": "pm_card_visa",
  "5555555555554444": "pm_card_mastercard",
  "4000000000000002": "pm_card_visa_chargeDeclined",
};

let clientStripe = null;

function obtenirClientStripe() {
  if (!environnement.cleStripe) return null;
  if (clientStripe) return clientStripe;

  // Chargement paresseux : le module n'est requis que si une clé existe,
  // pour que le projet démarre même sans la dépendance installée.
  const Stripe = require("stripe");
  clientStripe = new Stripe(environnement.cleStripe, { apiVersion: "2024-06-20" });
  return clientStripe;
}

function modePaiementActif() {
  return environnement.cleStripe ? "stripe" : "simulation";
}

// Vérifie la forme des informations saisies avant tout appel réseau.
function validerCarte(carte) {
  const numero = String(carte?.numero || "").replace(/\s/g, "");
  const expiration = String(carte?.expiration || "").trim();
  const cvv = String(carte?.cvv || "").trim();
  const titulaire = String(carte?.titulaire || "").trim();

  if (!/^\d{16}$/.test(numero)) return { valide: false, message: "Le numéro doit contenir 16 chiffres" };
  if (!/^\d{2}\/\d{2}$/.test(expiration)) return { valide: false, message: "La date doit être au format MM/AA" };
  if (!/^\d{3,4}$/.test(cvv)) return { valide: false, message: "Le CVV doit contenir 3 ou 4 chiffres" };
  if (titulaire.length < 3) return { valide: false, message: "Le nom du titulaire est trop court" };

  const [mois, annee] = expiration.split("/").map(Number);
  if (mois < 1 || mois > 12) return { valide: false, message: "Le mois d'expiration est invalide" };

  const finDeValidite = new Date(2000 + annee, mois, 0, 23, 59, 59);
  if (finDeValidite < new Date()) return { valide: false, message: "La carte est expirée" };

  return { valide: true, numero, titulaire };
}

// Effectue le paiement et renvoie l'état à enregistrer sur la commande.
// Lève une erreur porteuse d'un statut HTTP si le paiement échoue.
async function payerCommande({ montant, carte, description }) {
  const verification = validerCarte(carte);
  if (!verification.valide) {
    const erreur = new Error(`Informations de carte invalides : ${verification.message}`);
    erreur.status = 400;
    throw erreur;
  }

  const stripe = obtenirClientStripe();

  if (!stripe) {
    return {
      fournisseurPaiement: "simulation",
      statutPaiement: "payé",
      referencePaiement: `SIM-${Date.now()}-${verification.numero.slice(-4)}`,
      datePaiement: new Date(),
    };
  }

  const moyenDeTest = CARTES_DE_TEST[verification.numero];
  if (!moyenDeTest) {
    const erreur = new Error(
      "En mode test, seules les cartes de test Stripe sont acceptées (par exemple 4242 4242 4242 4242)."
    );
    erreur.status = 400;
    throw erreur;
  }

  try {
    const intention = await stripe.paymentIntents.create({
      amount: Math.round(montant * 100), // Stripe raisonne en cents
      currency: environnement.deviseStripe,
      description,
      payment_method: moyenDeTest,
      confirm: true,
      automatic_payment_methods: { enabled: true, allow_redirects: "never" },
    });

    if (intention.status !== "succeeded") {
      const erreur = new Error(`Paiement non abouti (état Stripe : ${intention.status})`);
      erreur.status = 402;
      throw erreur;
    }

    return {
      fournisseurPaiement: "stripe",
      statutPaiement: "payé",
      referencePaiement: intention.id,
      datePaiement: new Date(),
    };
  } catch (erreur) {
    if (erreur.status) throw erreur;

    const echec = new Error(erreur.message || "Le paiement a été refusé");
    echec.status = 402;
    throw echec;
  }
}

module.exports = { payerCommande, validerCarte, modePaiementActif, CARTES_DE_TEST };
