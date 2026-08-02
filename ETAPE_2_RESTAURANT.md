# Savora — Étape 2 : espace restaurant

Cette étape ajoute une interface restaurant reliée au backend et à Socket.IO.

## Fonctions ajoutées

- Redirection automatique selon le rôle après connexion.
- Tableau de bord restaurant.
- Liste des commandes du restaurant uniquement.
- Réception en temps réel des nouvelles commandes.
- Passage des statuts : `en attente` → `confirmée` → `en préparation` → `prête`.
- Annulation avant que la commande soit prête.
- Contrôle backend empêchant un restaurant d'accéder aux commandes d'un autre restaurant.
- Liaison d'un compte utilisateur à un restaurant avec `restaurantId`.

## Installation

Dans `backend` :

```powershell
npm install
npm run dev
```

Dans `mobile/App-Client` :

```powershell
npm install
npx expo start --lan --clear
```

Le fichier `.env` mobile doit contenir :

```env
EXPO_PUBLIC_API_URL=http://192.168.2.15:3000/api
EXPO_PUBLIC_SOCKET_URL=http://192.168.2.15:3000
```

## Créer ou convertir un compte restaurant

1. Récupérer l'identifiant du restaurant avec `GET /api/restaurants`.
2. Dans PowerShell, depuis le dossier `backend` :

```powershell
$env:COURRIEL_RESTAURANT="restaurant@savora.ca"
$env:MOT_DE_PASSE_RESTAURANT="Savora123!"
$env:RESTAURANT_ID="ID_DU_RESTAURANT"
$env:NOM_RESTAURANT_COMPTE="Gestionnaire Nami Sushi"
npm run creer-compte-restaurant
```

3. Se connecter dans l'application avec ce compte. L'application ouvre automatiquement `/restaurant-dashboard`.

## Test rapide

- Ouvrir l'application avec le compte restaurant.
- Dans une autre session, créer une commande avec un compte client pour ce restaurant.
- La commande doit apparaître sans actualiser manuellement.
- Appuyer successivement sur les boutons de changement de statut.
