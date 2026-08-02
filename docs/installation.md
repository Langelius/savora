# Installation et démarrage

## Prérequis

| Outil | Version | Vérification |
|-------|---------|--------------|
| Node.js | 20 ou plus | `node -v` |
| MongoDB | 6 ou plus, démarré | `mongosh --eval "db.version()"` |
| Expo Go | dernière version | sur le téléphone Android ou iOS |
| Git | — | `git --version` |

Le téléphone et l'ordinateur doivent être sur le **même réseau Wi-Fi**.

---

## 1. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run seed      # charge 3 restaurants et leurs plats
npm run dev
```

### Fichier `.env`

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/savora
JWT_SECRET=<64 caractères aléatoires>
ORIGINES_AUTORISEES=
STRIPE_SECRET_KEY=
```

Générer un secret solide :

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Le serveur **refuse de démarrer** si `MONGODB_URI` manque, si `JWT_SECRET` fait
moins de 32 caractères, ou si une clé Stripe **live** est fournie. C'est
volontaire : un message clair au démarrage vaut mieux qu'une panne obscure à la
première requête.

Au démarrage, la console affiche les adresses à utiliser :

```
API Savora 3.0.0 et Socket.IO démarrés
  local     : http://localhost:3000/api/sante
  téléphone : http://192.168.2.15:3000/api/sante
  paiement  : mode simulation
```

### Comptes de démonstration

```bash
# Administrateur
COURRIEL_ADMIN=admin@savora.ca MOT_DE_PASSE_ADMIN=Savora123! npm run creer-admin

# Gestionnaire de restaurant — le restaurant est désigné par son NOM exact
# (voir GET /api/restaurants), pas par son identifiant.
COURRIEL_RESTAURANT=resto@savora.ca MOT_DE_PASSE_RESTAURANT=Savora123! \
NOM_RESTAURANT="Nami Sushi" npm run creer-compte-restaurant

# Livreur
COURRIEL_LIVREUR=livreur@savora.ca MOT_DE_PASSE_LIVREUR=Savora123! npm run creer-compte-livreur
```

Sous PowerShell, utiliser `$env:NOM="valeur"` avant l'appel `npm run`.

---

## 2. Application mobile

```bash
cd mobile/App-Client
cp .env.example .env
npm install
npx expo start --clear --lan
```

### Fichier `.env`

Remplacer `192.168.X.Y` par l'adresse affichée au démarrage du backend :

```env
EXPO_PUBLIC_API_URL=http://192.168.X.Y:3000/api
EXPO_PUBLIC_SOCKET_URL=http://192.168.X.Y:3000
```

| Cible | Adresse à utiliser |
|-------|--------------------|
| Navigateur ou simulateur iOS | `http://localhost:3000/api` |
| Émulateur Android | `http://10.0.2.2:3000/api` |
| Téléphone physique | `http://<IP du PC>:3000/api` |

Après toute modification du `.env`, relancer avec `npx expo start --clear` :
Expo met les variables en cache.

### Pare-feu Windows

```powershell
netsh advfirewall firewall add rule name="Savora API 3000" dir=in action=allow protocol=TCP localport=3000
```

---

## 3. Vérifications

```bash
cd backend && npm test              # tests unitaires
cd mobile/App-Client && npm run typecheck
```

Depuis le navigateur du téléphone, ouvrir `http://<IP du PC>:3000/api/sante`.
Une réponse `{"ok":true}` confirme que le téléphone atteint le serveur — c'est
le premier test à faire avant de chercher plus loin.

---

## 4. Paiement Stripe (facultatif)

Sans clé, l'application fonctionne en **mode simulation** : rien à configurer.

Pour activer le vrai mode test :

1. Créer un compte sur [dashboard.stripe.com](https://dashboard.stripe.com).
2. Copier la clé secrète de test (`sk_test_...`).
3. La placer dans `backend/.env`, puis relancer le serveur.

Cartes de test acceptées :

| Numéro | Résultat attendu |
|--------|------------------|
| 4242 4242 4242 4242 | Paiement accepté |
| 5555 5555 5555 4444 | Paiement accepté (Mastercard) |
| 4000 0000 0000 0002 | Paiement **refusé** — utile pour démontrer le chemin d'erreur |

Expiration : une date future (`12/30`). CVV : trois chiffres quelconques.

---

## 5. Problèmes fréquents

| Symptôme | Cause probable | Solution |
|----------|----------------|----------|
| « Le serveur ne répond pas » | Mauvaise IP dans `.env` mobile | Utiliser l'adresse affichée par le backend, relancer avec `--clear` |
| `/api/sante` inaccessible du téléphone | Pare-feu Windows | Ajouter la règle ci-dessus |
| « JWT_SECRET doit contenir au moins 32 caractères » | Secret trop court | Regénérer avec la commande fournie |
| Catalogue vide | Base non initialisée | `npm run seed` |
| Erreurs JSX dans VS Code | Version TypeScript de l'éditeur | *TypeScript: Select TypeScript Version* → *Use Workspace Version* |
| Le socket ne se connecte pas | `EXPO_PUBLIC_SOCKET_URL` avec `/api` | L'URL Socket.IO ne contient pas `/api` |
