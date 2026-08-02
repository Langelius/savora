// Validation des champs d'un établissement et de ses plats.
//
// Fonctions pures : ni base de données, ni requête HTTP, ni dépendance
// externe. Elles sont donc testables unitairement en quelques millisecondes,
// et la règle de validation n'existe qu'à un seul endroit, qu'elle soit
// appelée par l'administration ou par un gestionnaire de restaurant.

function erreur(message, statut) {
  const e = new Error(message);
  e.status = statut;
  return e;
}

// Nettoie et valide les champs d'un établissement.
function lireChampsRestaurant(corps, { creation }) {
  const champs = {};

  const texte = (valeur) => String(valeur ?? "").trim();

  if (creation || corps.nom !== undefined) {
    const nom = texte(corps.nom);
    if (nom.length < 2) throw erreur("Le nom du restaurant est trop court", 400);
    champs.nom = nom;
  }

  if (creation || corps.cuisine !== undefined) {
    const cuisine = texte(corps.cuisine);
    if (cuisine.length < 2) throw erreur("Le type de cuisine est obligatoire", 400);
    champs.cuisine = cuisine;
  }

  if (creation || corps.image !== undefined) {
    const image = texte(corps.image);
    if (!/^https?:\/\//i.test(image)) {
      throw erreur("L'image doit être une URL commençant par http ou https", 400);
    }
    champs.image = image;
  }

  if (corps.description !== undefined) champs.description = texte(corps.description);
  if (corps.adresse !== undefined) champs.adresse = texte(corps.adresse);
  if (corps.delai !== undefined) champs.delai = texte(corps.delai) || "25–35 min";

  if (corps.fraisLivraison !== undefined) {
    const frais = Number(corps.fraisLivraison);
    if (!Number.isFinite(frais) || frais < 0 || frais > 50) {
      throw erreur("Les frais de livraison doivent être compris entre 0 et 50", 400);
    }
    champs.fraisLivraison = Math.round(frais * 100) / 100;
  }

  if (corps.actif !== undefined) champs.actif = Boolean(corps.actif);

  // La note et le nombre d'avis ne sont jamais saisis : ils sont calculés à
  // partir des avis réels. Les accepter ici permettrait de truquer la note.
  return champs;
}

// Nettoie et valide les champs d'un plat, options comprises.
function lireChampsPlat(corps, { creation }) {
  const champs = {};
  const texte = (valeur) => String(valeur ?? "").trim();

  if (creation || corps.nom !== undefined) {
    const nom = texte(corps.nom);
    if (nom.length < 2) throw erreur("Le nom du plat est trop court", 400);
    champs.nom = nom;
  }

  if (creation || corps.categorie !== undefined) {
    const categorie = texte(corps.categorie);
    if (categorie.length < 2) throw erreur("La catégorie est obligatoire", 400);
    champs.categorie = categorie;
  }

  if (creation || corps.image !== undefined) {
    const image = texte(corps.image);
    if (!/^https?:\/\//i.test(image)) {
      throw erreur("L'image doit être une URL commençant par http ou https", 400);
    }
    champs.image = image;
  }

  if (creation || corps.prix !== undefined) {
    const prix = Number(corps.prix);
    if (!Number.isFinite(prix) || prix <= 0 || prix > 1000) {
      throw erreur("Le prix doit être compris entre 0 et 1000", 400);
    }
    champs.prix = Math.round(prix * 100) / 100;
  }

  if (corps.description !== undefined) champs.description = texte(corps.description);
  if (corps.populaire !== undefined) champs.populaire = Boolean(corps.populaire);
  if (corps.disponible !== undefined) champs.disponible = Boolean(corps.disponible);

  if (corps.options !== undefined) {
    if (!Array.isArray(corps.options)) throw erreur("Les options doivent être une liste", 400);
    if (corps.options.length > 20) throw erreur("20 options au maximum par plat", 400);

    const options = [];
    const nomsVus = new Set();

    for (const brut of corps.options) {
      const nom = texte(brut?.nom);
      if (nom.length < 2) throw erreur("Chaque option doit porter un nom", 400);
      if (nomsVus.has(nom)) throw erreur(`Option en double : ${nom}`, 400);
      nomsVus.add(nom);

      const prix = Number(brut?.prix ?? 0);
      if (!Number.isFinite(prix) || prix < 0 || prix > 500) {
        throw erreur(`Supplément invalide pour l'option « ${nom} »`, 400);
      }

      options.push({ nom, prix: Math.round(prix * 100) / 100 });
    }

    champs.options = options;
  }

  return champs;
}

module.exports = { erreur, lireChampsRestaurant, lireChampsPlat };
