# Rapport de projet — Savora

> Brouillon de travail. Le rapport final mis en forme est déposé dans
> [`/livrables`](../../livrables).

## 1. Présentation du projet

Savora est une application mobile de commande et de livraison de repas,
réalisée par l'équipe Global SoftCorporation dans le cadre du cours de
documentation technique de l'Institut Teccart. Elle met en relation quatre
acteurs — client, restaurant, livreur et administrateur — au sein d'une seule
application Expo / React Native adossée à une API Node.js et à MongoDB.

## 2. Objectifs

Livrer les quatre fonctionnalités imposées — menu interactif avec
personnalisation, suivi de commande en temps réel, paiement intégré, notation
des restaurants — accompagnées d'une documentation technique continue et d'un
historique Git lisible.

## 3. Analyse des besoins

Voir le cahier des charges v3.0 dans `/livrables` et les user stories dans
[`docs/user-stories/`](../user-stories/).

## 4. Méthodologie

Scrum adapté à quatre personnes sur douze semaines : trois sprints de quatre
semaines avec revue à mi-sprint. Workflow Git par branches de fonctionnalité,
Pull Request revue par un coéquipier, documentation mise à jour dans la même PR
que le code.

## 5. Difficultés rencontrées

1. **Le suivi temps réel n'était pas démontrable dans le périmètre initial.**
   Les statuts « en route » et « livrée » n'avaient aucun acteur pour les
   déclencher, faute d'application livreur.
2. **Le SDK Stripe ne fonctionne pas dans Expo Go**, l'outil utilisé pour les
   démonstrations sur téléphone.
3. **Les erreurs asynchrones du backend étaient silencieuses.** Une promesse
   rejetée dans un contrôleur n'atteignait jamais le gestionnaire d'erreurs :
   la requête restait en attente jusqu'au délai d'expiration.
4. **Adresses IP écrites en dur** dans trois fichiers : l'application cessait
   de fonctionner à chaque changement de réseau.
5. **Session perdue à chaque fermeture** de l'application : le jeton ne vivait
   qu'en mémoire React.
6. **Dérive entre la documentation et le code** : le schéma de base de données
   et la documentation d'API décrivaient encore l'état du Sprint 1.

## 6. Solutions apportées

| Difficulté | Solution | Trace |
|------------|----------|-------|
| 1 | Élargissement à quatre rôles dans une seule application | [ADR 0005](../decisions/0005-multi-roles.md) |
| 2 | Stripe en mode test côté serveur, avec repli sur simulation hors ligne | [ADR 0004](../decisions/0004-paiement-stripe-ou-simulation.md) |
| 3 | Enveloppe `asynchrone()` sur toutes les routes, couverte par un test | `backend/src/utils/asynchrone.js` |
| 4 | Configuration réseau centralisée dans `constants/config.ts` ; le serveur affiche les IP détectées au démarrage | `mobile/App-Client/src/constants/config.ts` |
| 5 | Jeton conservé dans le trousseau système via expo-secure-store, session restaurée au lancement | `mobile/App-Client/src/services/stockage.ts` |
| 6 | Reprise complète de `/docs` sur l'état réel du code, avec ADR rétroactifs | ce dossier |

## 7. Résultats obtenus

- Les quatre fonctionnalités imposées sont opérationnelles.
- Le parcours complet fonctionne de bout en bout sur téléphone, avec quatre
  rôles et mise à jour en temps réel.
- 16 tests unitaires automatisés, vérification des types côté mobile,
  intégration continue sur chaque Pull Request.
- Corrections de sécurité : limitation de débit, en-têtes HTTP, CORS restreint,
  échappement des expressions régulières, rechargement du rôle à chaque requête.
- Documentation technique alignée sur le code livré.

## 8. Perspectives d'amélioration

- Tests d'intégration automatisés (Supertest + MongoDB en mémoire).
- Envoi réel de courriels pour la réinitialisation de mot de passe.
- Position du livreur diffusée en continu par Socket.IO plutôt que positions
  fixes sur la carte.
- Limitation de débit partagée via Redis pour un déploiement multi-instances.
- Notifications poussées, pourboires, modération des avis.
- Déploiement du backend sur Render ou Railway.
