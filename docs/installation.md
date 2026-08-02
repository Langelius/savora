# Installation et exécution

## Prérequis

- Node.js 20 ou supérieur
- React Native CLI (ou Expo)
- MongoDB (local ou MongoDB Atlas)
- Un compte Stripe en mode test

## Backend

```bash
cd backend
npm install

npm run dev            # démarre le serveur en mode développement
```

## Application mobile

```bash
cd mobile
npm install
npx react-native run-android   # ou : npx expo start
```

## Variables d'environnement (backend)

| Variable | Description |
|----------|-------------|
| PORT | Port du serveur (ex. 3000) |
| MONGODB_URI | Chaîne de connexion MongoDB |
| JWT_SECRET | Clé secrète pour les jetons |
| STRIPE_SECRET_KEY | Clé secrète Stripe (test) |
