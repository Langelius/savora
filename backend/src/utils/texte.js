// Utilitaires de traitement de texte.

// Neutralise les caractères spéciaux d'une expression régulière.
//
// Les recherches de l'API construisent un $regex à partir de la saisie de
// l'utilisateur. Sans échappement, une saisie comme « (a+)+$ » devient une
// expression régulière coûteuse (déni de service par ReDoS) et des caractères
// comme « . » ou « * » modifient silencieusement le sens de la recherche.
function echapperRegex(valeur) {
  return String(valeur).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Construit un filtre de recherche insensible à la casse, sûr et borné.
function construireRecherche(saisie, champs) {
  const terme = String(saisie || "").trim().slice(0, 80);
  if (!terme) return null;

  const motif = new RegExp(echapperRegex(terme), "i");
  const conditions = [];
  for (const champ of champs) {
    conditions.push({ [champ]: motif });
  }
  return { $or: conditions };
}

module.exports = { echapperRegex, construireRecherche };
