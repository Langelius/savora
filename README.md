# Application de livraison de repas

Application mobile de livraison de repas développée en **React Native** (mobile),
**Node.js / Express** (backend) et **MongoDB** (base de données), dans le cadre
du cours de documentation technique à l'Institut Teccart.

## Fonctionnalités (MVP)

- **Menu interactif** — parcourir les plats et les personnaliser
- **Suivi de commande en temps réel** — préparation → en route → livrée
- **Paiement intégré** — Stripe en mode test (sandbox)
- **Notation des restaurants** — note et commentaire après livraison

## Architecture

Application client-serveur. Voir [docs/architecture.md](./docs/architecture.md).

```
React Native (mobile)  ⇄  Node.js + Express (API)  ⇄  MongoDB
                          ├── Stripe (paiement, sandbox)
                          ├── Socket.IO (suivi temps réel)
                          └── Google Maps API (cartes)
```

## Démarrage rapide

Voir [docs/installation.md](./docs/installation.md).

```bash
# Backend
cd backend && npm install && npm run dev

# Application mobile
cd mobile && npm install && npx react-native run-android   # ou : npx expo start
```

## Documentation

Toute la documentation vit dans [`/docs`](./docs/README.md) (approche *docs-as-code*).

## Équipe — Global SoftCorporation

| Membre | Rôle |
|--------|------|
| JORDAN | Lead technique / Backend |
| YAN | Frontend React Native |
| WILFRED | Intégrations & temps réel |
| ARCHANGE | QA / DevOps / Coordination doc |

## Licence

Projet académique — Institut Teccart.
