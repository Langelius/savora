# Backend Savora

API REST Node.js, Express et MongoDB pour l'application de livraison.

## Installation

```bash
npm install
cp .env.example .env
npm run dev
```

MongoDB local : `mongodb://127.0.0.1:27017/savora`. MongoDB Atlas fonctionne aussi en remplaçant `MONGODB_URI`.

## Routes principales

- `POST /api/auth/inscription`
- `POST /api/auth/connexion`
- `GET /api/auth/profil` avec jeton Bearer
- `GET /api/restaurants`
- `GET /api/restaurants/:id`
- `GET /api/commandes` avec jeton Bearer
- `POST /api/commandes` avec jeton Bearer
- `GET /api/commandes/:id` avec jeton Bearer
