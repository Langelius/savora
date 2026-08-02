# Backend Savora

API REST et temps réel de l'application Savora — Node.js, Express, MongoDB, Socket.IO.

## Installation

```bash
npm install
cp .env.example .env    # renseigner MONGODB_URI et JWT_SECRET
npm run seed            # jeu de données de démonstration
npm run dev
```

MongoDB local par défaut : `mongodb://127.0.0.1:27017/savora`. MongoDB Atlas
fonctionne également en remplaçant `MONGODB_URI`.

Le serveur refuse de démarrer si `MONGODB_URI` manque, si `JWT_SECRET` fait
moins de 32 caractères, ou si une clé Stripe de production est fournie.

## Scripts

| Commande | Effet |
|----------|-------|
| `npm run dev` | Démarre avec rechargement automatique et affiche les adresses réseau |
| `npm start` | Démarre en mode simple |
| `npm test` | Exécute les 16 tests unitaires (`node --test`) |
| `npm run seed` | Recharge le catalogue de démonstration |
| `npm run creer-admin` | Crée un compte administrateur |
| `npm run creer-compte-restaurant` | Crée un compte gestionnaire de restaurant |
| `npm run creer-compte-livreur` | Crée un compte livreur |

## Structure

```
src/
├── config/       environnement validé, MongoDB, salons Socket.IO
├── middleware/   authentification, rôles, sécurité HTTP, erreurs
├── services/     règles métier pures (tarification, statuts, paiement)
├── models/       schémas Mongoose
├── controllers/  orchestration HTTP
├── routes/       points d'entrée
└── utils/        enveloppe asynchrone, échappement de regex
```

## Documentation

Les 28 routes et les événements Socket.IO sont documentés dans
[`../docs/api/README.md`](../docs/api/README.md).
