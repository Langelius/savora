// Machine à états du cycle de vie d'une commande.
//
// Isolée du contrôleur pour être testable unitairement et pour que la règle
// existe à un seul endroit (le modèle, le contrôleur et l'application mobile
// s'y réfèrent tous).

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

// Transitions autorisées depuis chaque statut.
const TRANSITIONS = {
  "en attente": ["confirmée", "annulée"],
  "confirmée": ["en préparation", "annulée"],
  "en préparation": ["prête", "annulée"],
  "prête": ["prise en charge"],
  "prise en charge": ["en route"],
  "en route": ["livrée"],
  "livrée": [],
  "annulée": [],
};

// Statuts que chaque rôle a le droit de poser.
const STATUTS_PAR_ROLE = {
  restaurant: ["confirmée", "en préparation", "prête", "annulée"],
  livreur: ["en route", "livrée"],
  admin: STATUTS,
};

function estStatutConnu(statut) {
  return STATUTS.includes(statut);
}

function transitionAutorisee(statutActuel, statutVise) {
  const suivants = TRANSITIONS[statutActuel];
  return Array.isArray(suivants) && suivants.includes(statutVise);
}

function roleAutorise(role, statutVise) {
  const autorises = STATUTS_PAR_ROLE[role];
  return Array.isArray(autorises) && autorises.includes(statutVise);
}

module.exports = {
  STATUTS,
  TRANSITIONS,
  STATUTS_PAR_ROLE,
  estStatutConnu,
  transitionAutorisee,
  roleAutorise,
};
