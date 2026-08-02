# Architecture du système

> État au 2 août 2026 — version 3.0 de l'API. Ce document décrit ce qui est
> **réellement implémenté**, pas ce qui était prévu au cadrage.

## Vue d'ensemble

Savora suit une architecture **client-serveur**. Une application mobile Expo /
React Native communique avec un backend Node.js/Express par une **API REST**
pour les opérations classiques, et par un **canal Socket.IO** pour tout ce qui
doit apparaître sans rafraîchissement : nouvelles commandes, changements de
statut, messages de discussion.

![Architecture du système](./diagrammes/architecture.svg)

*Figure 1 — Architecture client-serveur de l'application.*

## Composants réels

| Composant | Technologie | Rôle |
|-----------|-------------|------|
| Application mobile | Expo SDK 54, React Native 0.81, **TypeScript**, expo-router | Interface des quatre rôles (Android, iOS, web) |
| Serveur / API | Node.js 20+, Express 4 | Logique métier, routes REST, contrôle d'accès |
| Base de données | MongoDB 6+ via Mongoose 8 | Persistance |
| Temps réel | Socket.IO 4 | Suivi de commande et discussion |
| Paiement | Stripe (mode test) **ou** simulation locale | Encaissement de la commande |
| Cartographie | react-native-maps + expo-location | Trajet du livreur |
| Authentification | JWT (24 h) + bcrypt (12 tours) | Sessions et mots de passe |
| Session mobile | expo-secure-store | Conservation du jeton entre deux lancements |

> **Écart assumé par rapport au cadrage.** Le cahier des charges v2 prévoyait
> React Native en JavaScript avec Redux ou Context API, et Google Maps API.
> Le projet utilise TypeScript (voir [ADR 0003](./decisions/0003-typescript-et-expo-router.md)),
> Context API seul (le volume d'état ne justifiait pas Redux) et
> react-native-maps sans clé Google Maps, l'écran de carte se contentant du
> fournisseur natif de la plateforme.

## Découpage du backend

```
backend/src/
├── index.js              point d'entrée : middlewares, routes, démarrage
├── config/
│   ├── environnement.js  lecture et validation des variables .env
│   ├── db.js             connexion Mongoose
│   └── socket.js         authentification et salons Socket.IO
├── middleware/
│   ├── auth.js           vérification du jeton + rechargement de l'utilisateur
│   ├── roles.js          autorisation par rôle
│   ├── securite.js       en-têtes HTTP, limitation de débit, politique CORS
│   └── erreurs.js        404 et gestionnaire d'erreurs unique
├── services/             règles métier pures, testables sans base de données
│   ├── tarification.js   prix des lignes, taxes, total
│   ├── statutsCommande.js machine à états et droits par rôle
│   └── paiement.js       Stripe en mode test, ou simulation
├── models/               schémas Mongoose
├── controllers/          orchestration HTTP
├── routes/               déclaration des points d'entrée
├── utils/                enveloppe asynchrone, échappement de regex
└── scripts/              seed et création de comptes
```

Le découpage **services / controllers** a été introduit pour que les règles
métier (calcul du total, transitions de statut) soient testables unitairement
et n'existent qu'à un seul endroit.

## Flux d'une commande

![Parcours d'une commande](./diagrammes/sequence_commande.svg)

*Figure 3 — Du panier au paiement, puis suivi en temps réel et notation.*

1. Le client compose son panier, choisit ses options de personnalisation et
   valide (`POST /api/commandes`).
2. Le serveur **relit les prix en base** — il ne fait jamais confiance aux
   montants envoyés par le client —, calcule sous-total, taxes et total.
3. Le paiement est traité **avant** l'enregistrement : la commande n'existe en
   base que si le paiement a réussi, ou s'il est différé à la livraison.
4. La commande est diffusée par Socket.IO au restaurant concerné et aux
   administrateurs (`commande:nouvelle`).
5. Le restaurant fait évoluer le statut : `confirmée → en préparation → prête`.
   Chaque transition est validée par la machine à états.
6. Au statut `prête`, la commande apparaît chez tous les livreurs
   (`commande:disponible`). Le premier qui accepte l'obtient : l'attribution
   utilise un `findOneAndUpdate` **atomique**, ce qui empêche deux livreurs de
   prendre la même course.
7. Le livreur passe `en route` puis `livrée`. Le client voit chaque étape sans
   rafraîchir (`commande:mise-a-jour`).
8. Une fois livrée, le client peut noter le restaurant
   (`POST /api/commandes/:id/avis`). La note moyenne est recalculée par
   agrégation MongoDB.

## Temps réel : organisation des salons

À la connexion, le socket est authentifié par le même jeton JWT que l'API,
puis rejoint automatiquement plusieurs salons :

| Salon | Qui le rejoint | Ce qu'il reçoit |
|-------|----------------|-----------------|
| `utilisateur:<id>` | tout compte connecté | ses propres commandes |
| `role:livreur` | les livreurs | les commandes disponibles |
| `role:admin` | les administrateurs | toute l'activité |
| `restaurant:<id>` | les comptes restaurant | les commandes de leur établissement |
| `commande:<id>` | à la demande | messages de la discussion |

Un socket sans jeton valide est refusé à la poignée de main : le canal temps
réel n'est pas une porte dérobée qui contournerait l'API.

## Sécurité

- Mots de passe hachés avec bcrypt (12 tours), jamais renvoyés par l'API
  (`select: false` sur le champ).
- Jeton JWT de 24 h. Le middleware **recharge l'utilisateur en base** à chaque
  requête : un compte supprimé ou rétrogradé perd ses droits immédiatement, sans
  attendre l'expiration du jeton.
- Le rôle ne peut pas être choisi à l'inscription ni modifié via `PUT /auth/profil`.
- Limitation de débit sur `/auth/connexion` (10 tentatives par 15 minutes) et
  garde-fou global à 300 requêtes par minute.
- En-têtes de sécurité HTTP et politique CORS par liste blanche en production.
- Les saisies de recherche sont échappées avant d'entrer dans un `$regex`
  (protection contre le ReDoS).
- Aucun numéro de carte n'est stocké : seule la référence de transaction l'est.

Détail des choix : [ADR 0004](./decisions/0004-paiement-stripe-ou-simulation.md).

## Limites connues

- Pas d'envoi de courriel : le jeton de réinitialisation de mot de passe est
  renvoyé dans la réponse HTTP **en développement uniquement**.
- La position du livreur sur la carte utilise la position du téléphone du
  livreur ; les positions du restaurant et du client sont encore fixes.
- La limitation de débit est en mémoire de processus : elle ne se partage pas
  entre plusieurs instances du serveur.
- Aucun test d'intégration automatisé sur les routes ; les tests couvrent les
  services métier et les utilitaires de sécurité.
