# Savora — application mobile de livraison de repas

Application mobile de commande et de livraison de repas, développée en
**React Native / Expo (TypeScript)**, **Node.js / Express** et **MongoDB**,
dans le cadre du cours de documentation technique à l'Institut Teccart.

> Le projet s'appelait « RepasExpress » lors du cadrage initial. Il a été
> renommé **Savora** au Sprint 2, en même temps que l'élargissement du
> périmètre aux quatre rôles décrits ci-dessous.

## Ce que fait l'application

| Rôle | Ce qu'il peut faire |
|------|---------------------|
| **Client** | Parcourir les restaurants, personnaliser ses plats, payer, suivre la livraison en direct, discuter, noter le restaurant |
| **Restaurant** | Recevoir les commandes en temps réel, faire évoluer leur statut, **gérer son menu et ses options** |
| **Livreur** | Voir les livraisons disponibles, en accepter une (attribution atomique), suivre le trajet sur carte |
| **Administrateur** | Statistiques, gestion des utilisateurs et des commandes, **création de restaurants et de leurs menus** |

Les quatre fonctionnalités imposées par le cahier des charges sont couvertes :
menu interactif avec personnalisation, suivi en temps réel, paiement intégré,
notation des restaurants. S'y ajoutent la discussion par commande, les
notifications à chaque étape et la gestion du catalogue depuis l'application.

## Architecture

```
Expo / React Native (TypeScript)
        │  REST (HTTP)          │  Socket.IO (WebSocket)
        ▼                       ▼
   Node.js + Express  ──────────────────►  MongoDB (Mongoose)
        ├── Stripe (mode test, ou simulation hors ligne)
        ├── Expo Push (notifications, avec repli local)
        └── expo-location + react-native-maps (côté mobile)
```

Détails : [docs/architecture.md](./docs/architecture.md).
Déploiement : [docs/exploitation/deploiement.md](./docs/exploitation/deploiement.md)
(Render ou Railway, configurations versionnées).

## Démarrage rapide

```bash
# Backend
cd backend
cp .env.example .env        # renseigner MONGODB_URI et JWT_SECRET
npm install
npm run seed                # jeu de données de démonstration
npm run dev

# Application mobile
cd mobile/App-Client
cp .env.example .env        # renseigner l'adresse IP du PC
npm install
npx expo start --clear
```

Procédure complète : [docs/installation.md](./docs/installation.md).
Procédure de test : [docs/exploitation/guide-de-test.md](./docs/exploitation/guide-de-test.md).

## Vérifications

```bash
cd backend && npm test                  # 30 tests unitaires (node:test)
cd mobile/App-Client && npm run typecheck
```

## Documentation

Toute la documentation vit dans [`/docs`](./docs/README.md), en Markdown,
versionnée avec le code (*docs-as-code*). Les documents formels remis au cours
se trouvent dans [`/livrables`](./livrables).

## Équipe — Global SoftCorporation

| Membre | Rôle |
|--------|------|
| JORDAN DONGMEZA | Lead technique / Backend — Scrum Master |
| YAN SAH | Frontend React Native |
| WILFRED GALIMAR | Intégrations & temps réel |
| ARCHANGE GUIMDO | QA / DevOps / Coordination documentaire — Product Owner |

## Licence

Projet académique — Institut Teccart. Aucune exploitation commerciale.
