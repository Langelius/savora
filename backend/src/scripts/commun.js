// Utilitaires partagés par les scripts d'administration.
//
// Ces scripts créent des comptes privilégiés. Trois règles s'appliquent :
//
//   1. Aucun identifiant n'est écrit en dur. Un mot de passe présent dans le
//      code source est un mot de passe public dès le premier push.
//   2. Les mots de passe manifestement faibles sont refusés.
//   3. Un échec renvoie un code de sortie non nul, sinon une erreur passe
//      pour un succès dans un script d'automatisation.

const { environnement } = require("../config/environnement");

const LONGUEUR_MINIMALE = 12;

// Mots de passe qui ont circulé dans la documentation et les notes d'étape
// du projet : ils doivent être considérés comme compromis.
const MOTS_DE_PASSE_INTERDITS = [
  "savora123!",
  "savora123",
  "motdepasse",
  "password",
  "admin1234",
  "changeme",
];

class ErreurScript extends Error {}

function lireVariable(nom, { obligatoire = true, defaut = "" } = {}) {
  // Une variable définie mais vide doit être traitée comme absente : les
  // interfaces d'hébergement (Render, Railway) transmettent une chaîne vide
  // pour un champ laissé blanc, et « ?? » ne l'intercepterait pas.
  const brut = String(process.env[nom] ?? "").trim();
  const valeur = brut || String(defaut).trim();

  if (obligatoire && !valeur) {
    throw new ErreurScript(
      `La variable ${nom} est obligatoire. Exemple :\n` +
        `  PowerShell : $env:${nom}="valeur"\n` +
        `  bash       : ${nom}="valeur" npm run <script>`
    );
  }

  return valeur;
}

function lireCourriel(nom) {
  const courriel = lireVariable(nom).toLowerCase();

  if (!/^\S+@\S+\.\S+$/.test(courriel)) {
    throw new ErreurScript(`${nom} n'est pas une adresse courriel valide.`);
  }

  return courriel;
}

function lireMotDePasse(nom) {
  const motDePasse = String(process.env[nom] ?? "");

  if (!motDePasse) {
    throw new ErreurScript(
      `La variable ${nom} est obligatoire. Générer un mot de passe solide :\n` +
        `  node -e "console.log(require('crypto').randomBytes(12).toString('base64url'))"`
    );
  }

  if (motDePasse.length < LONGUEUR_MINIMALE) {
    throw new ErreurScript(
      `${nom} doit contenir au moins ${LONGUEUR_MINIMALE} caractères ` +
        `(il s'agit d'un compte privilégié, pas d'un compte client).`
    );
  }

  if (MOTS_DE_PASSE_INTERDITS.includes(motDePasse.toLowerCase())) {
    throw new ErreurScript(
      `${nom} correspond à un mot de passe de démonstration qui a circulé ` +
        `dans la documentation du projet. Il est à considérer comme public.`
    );
  }

  return motDePasse;
}

// Avertit lorsqu'un script privilégié est lancé sur la base de production.
function avertirSiProduction() {
  const uri = environnement.uriMongo || "";
  const distante = !uri.includes("127.0.0.1") && !uri.includes("localhost");

  if (environnement.modeProduction || distante) {
    console.warn(
      "\n⚠  Base distante ou environnement de production détecté.\n" +
        "   Ce script crée un compte privilégié. Vérifie la valeur de MONGODB_URI.\n"
    );
  }
}

// Enveloppe commune : connexion, exécution, déconnexion, code de sortie juste.
async function executerScript(action) {
  const mongoose = require("mongoose");
  const connecterBaseDeDonnees = require("../config/db");

  try {
    avertirSiProduction();
    await connecterBaseDeDonnees();
    await action();
  } catch (erreur) {
    // Une ErreurScript est un problème de configuration : le message suffit.
    // Toute autre erreur mérite sa trace complète.
    if (erreur instanceof ErreurScript) console.error(`\n${erreur.message}\n`);
    else console.error("\nÉchec du script :", erreur);

    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

module.exports = {
  ErreurScript,
  lireVariable,
  lireCourriel,
  lireMotDePasse,
  executerScript,
  LONGUEUR_MINIMALE,
};
