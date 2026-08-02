# Documentation des API REST

Base URL : `http://localhost:3000/api`

## Authentification

Les routes protégées attendent un en-tête :
`Authorization: Bearer <jeton JWT>`

Le jeton est valide **24 heures**. Passé ce délai, l'API répond `401 Jeton invalide`
et l'utilisateur doit se reconnecter.

---

### POST /auth/inscription
Crée un compte utilisateur.

**Corps**
```json
{ "nom": "string", "courriel": "string", "motDePasse": "string" }
```
**Réponse 201**
```json
{ "token": "string", "utilisateur": { "id": "...", "nom": "..." } }
```
**Erreurs** : 400 (champs manquants), 409 (courriel déjà utilisé)

---

### POST /auth/connexion
Authentifie un utilisateur et renvoie un jeton.

**Corps**
```json
{ "courriel": "string", "motDePasse": "string" }
```
**Réponse 200**
```json
{ "token": "string", "utilisateur": { "id": "...", "nom": "..." } }
```
**Erreurs** : 401 (identifiants invalides)

---

### GET /auth/profil
Renvoie le profil de l'utilisateur connecté (route protégée).

**Réponse 200**
```json
{ "utilisateur": { "id": "...", "nom": "...", "courriel": "...", "adresse": "...", "role": "client" } }
```
**Erreurs** : 401 (jeton manquant ou invalide), 404 (utilisateur introuvable)

---

### PUT /auth/profil
Modifie le profil de l'utilisateur connecté (route protégée).
Champs modifiables : `nom`, `courriel`, `adresse`.

**Corps**
```json
{ "nom": "string", "courriel": "string", "adresse": "string" }
```
**Réponse 200** : profil mis à jour (même format que GET /auth/profil)

**Erreurs** : 400 (aucun champ à modifier), 401, 409 (courriel déjà utilisé)

---

### POST /auth/mot-de-passe-oublie
Génère un jeton de réinitialisation valide **1 heure**.

**Corps**
```json
{ "courriel": "string" }
```
**Réponse 200** : message générique (identique que le courriel existe ou non).

> Note pédagogique : sans service de courriel, le jeton est renvoyé dans la
> réponse. En production, il serait envoyé par courriel à l'utilisateur.

---

### POST /auth/reinitialisation
Change le mot de passe à l'aide du jeton de réinitialisation.

**Corps**
```json
{ "courriel": "string", "jeton": "string", "nouveauMotDePasse": "string" }
```
**Réponse 200** : confirmation.
**Erreurs** : 400 (champs manquants, jeton invalide ou expiré)

---

### GET /restaurants
Liste les restaurants disponibles. Filtres : `?categorie=pizza`.

---

### GET /restaurants/:id/plats
Liste les plats d'un restaurant.

---

### POST /commandes
Crée une commande (route protégée).

**Corps**
```json
{ "restaurantId": "...", "plats": [ { "platId": "...", "quantite": 1, "options": [] } ], "adresseLivraison": "..." }
```

---

### GET /commandes/:id
Renvoie le détail et le statut d'une commande.

---

### POST /avis
Enregistre une note et un commentaire pour une commande livrée.

```json
{ "commandeId": "...", "note": 5, "commentaire": "..." }
```
