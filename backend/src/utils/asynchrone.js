// Enveloppe une fonction de contrôleur asynchrone.
//
// Sans cette enveloppe, une promesse rejetée dans un contrôleur n'est jamais
// transmise à Express : la requête reste en attente jusqu'au délai d'expiration
// et Node journalise un « unhandled rejection ». Le middleware d'erreurs n'était
// donc jamais atteint. On capture le rejet et on le passe à next().
function asynchrone(fonction) {
  return function executer(requete, reponse, suivant) {
    Promise.resolve(fonction(requete, reponse, suivant)).catch(suivant);
  };
}

module.exports = asynchrone;
