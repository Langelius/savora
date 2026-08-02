# Documentation de l'API REST — Savora v3.1

**Base URL** : `http://<hôte>:3000/api`

Toutes les réponses sont en JSON. En cas d'erreur, le corps contient toujours
un champ `message` lisible par un humain.

## Authentification

Les routes protégées attendent l'en-tête :

```
Authorization: Bearer <jeton JWT>
```

Le jeton est valide **24 heures**. À chaque requête, le serveur recharge
l'utilisateur depuis la base : un compte supprimé ou dont le rôle a changé
perd ses droits immédiatement.

| Code | Signification |
|------|---------------|
| 400 | Requête mal formée |
| 401 | Jeton absent, invalide ou expiré |
| 402 | Paiement refusé |
| 403 | Rôle insuffisant ou ressource d'un autre utilisateur |
| 404 | Ressource introuvable |
| 409 | Conflit (doublon, transition de statut impossible) |
| 429 | Trop de requêtes (limitation de débit) |

---

# 1. Général

### GET /sante
Vérifie que l'API répond. Route publique, utile depuis le navigateur du téléphone.

**200** — `{ "ok": true, "date": "2026-08-02T14:00:00.000Z" }`

### GET /configuration
Configuration publique consommée par l'application mobile. Évite de recopier
le taux de taxes dans le code du client.

**200**
```json
{ "version": "3.0.0", "tauxTaxes": 0.14975, "devise": "CAD", "modePaiement": "simulation" }
```

`modePaiement` vaut `stripe` si une clé de test est configurée, `simulation` sinon.

---

# 2. Authentification — `/auth`

### POST /auth/inscription
Crée un compte **client**. Le rôle ne peut pas être choisi par l'appelant.

Limite : 20 inscriptions par heure et par adresse IP.

**Corps** — `{ "nom": "string", "courriel": "string", "motDePasse": "string (≥ 8)" }`

**201**
```json
{
  "token": "eyJ...",
  "utilisateur": { "id": "...", "nom": "...", "courriel": "...", "role": "client", "restaurantId": null }
}
```
**Erreurs** : 400 (champs invalides), 409 (courriel déjà utilisé), 429

---

### POST /auth/connexion
Limite : 10 tentatives par 15 minutes et par adresse IP.

**Corps** — `{ "courriel": "string", "motDePasse": "string" }`

**200** — même forme que l'inscription.

**Erreurs** : 401 (identifiants invalides — message identique que le compte
existe ou non, pour ne pas révéler quelles adresses sont inscrites), 429

---

### GET /auth/profil 🔒
**200** — `{ "utilisateur": { ... } }` — 404 si le compte n'existe plus.

### PUT /auth/profil 🔒
Champs modifiables : `nom`, `telephone`, `adresses`, `courriel`.
`role` et `restaurantId` sont volontairement ignorés.

**Erreurs** : 400 (aucun champ), 409 (courriel déjà pris)

---

### POST /auth/mot-de-passe-oublie
**Corps** — `{ "courriel": "string" }`

**200** — message générique, identique que le compte existe ou non.

> Aucun service d'envoi de courriel n'est branché. En développement, le jeton
> est renvoyé dans la réponse pour permettre les tests. En production
> (`NODE_ENV=production`), il ne l'est pas.

### POST /auth/reinitialisation
**Corps** — `{ "courriel", "jeton", "nouveauMotDePasse" }` — jeton valide 1 heure.

---

# 3. Catalogue — `/restaurants` (public)

### GET /restaurants
**Paramètre** — `recherche` (facultatif) : filtre sur le nom et le type de cuisine.
La saisie est échappée avant d'entrer dans l'expression régulière.

**200** — `{ "restaurants": [ { "_id", "nom", "cuisine", "image", "note", "nombreAvis", "delai", "fraisLivraison" } ] }`

### GET /restaurants/:id
**200** — `{ "restaurant": {...}, "plats": [ { ..., "options": [{ "nom", "prix" }] } ] }`

### GET /restaurants/:id/avis
Avis publics, du plus récent au plus ancien (50 maximum).

**200** — `{ "restaurant": { "_id", "nom", "note", "nombreAvis" }, "avis": [...] }`

---

# 4. Commandes — `/commandes` 🔒

### POST /commandes — rôle `client`
Crée une commande. **Les prix sont relus en base** : les montants envoyés par
le client sont ignorés.

**Corps**
```json
{
  "restaurantId": "...",
  "plats": [ { "platId": "...", "quantite": 2, "options": ["Bacon"] } ],
  "adresseLivraison": "123 rue Exemple, Montréal",
  "methodePaiement": "carte",
  "paiement": { "titulaire": "...", "numero": "4242424242424242", "expiration": "12/30", "cvv": "123" }
}
```

`paiement` n'est requis que si `methodePaiement` vaut `carte`.

**201** — `{ "commande": { ... } }`
**Erreurs** : 400 (plat invalide, carte mal formée), 402 (paiement refusé), 404 (restaurant)

**Effet temps réel** : `commande:nouvelle` vers le restaurant et les administrateurs.

---

### GET /commandes
Renvoie les commandes de l'appelant, selon son rôle : ses propres commandes
(client), celles qui lui sont attribuées (livreur), celles de son établissement
(restaurant).

**Paramètres** — `page` (défaut 1), `taille` (défaut 20, maximum 100)

**200** — `{ "commandes": [...], "pagination": { "page", "taille", "total" } }`

### GET /commandes/disponibles — rôles `livreur`, `admin`
Commandes au statut `prête` et sans livreur.

### GET /commandes/:id
Accessible au client propriétaire, au restaurant concerné, au livreur assigné
et aux administrateurs. **403** sinon.

---

### PATCH /commandes/:id/accepter — rôle `livreur`
Attribution **atomique** : si deux livreurs appuient au même instant, un seul
obtient la commande.

**200** — `{ "commande": {...} }` · **409** si déjà prise · **404** si inexistante

**Effet temps réel** : `commande:attribuee`.

---

### PATCH /commandes/:id/statut — rôles `restaurant`, `livreur`, `admin`
**Corps** — `{ "statut": "en préparation" }`

Statuts autorisés par rôle :

| Rôle | Peut poser |
|------|------------|
| restaurant | `confirmée`, `en préparation`, `prête`, `annulée` |
| livreur | `en route`, `livrée` |
| admin | tous |

La transition doit également être permise par la machine à états
(voir [base-de-donnees.md](../base-de-donnees.md)).

**Erreurs** : 400 (statut inconnu), 403 (rôle ou propriété), 409 (transition impossible)

**Effet temps réel** : `commande:mise-a-jour`.

---

# 5. Notation — 🔒

### POST /commandes/:id/avis — rôle `client`
Note le restaurant après livraison.

**Corps** — `{ "note": 5, "commentaire": "Excellent" }` (note entière de 1 à 5,
commentaire facultatif, 600 caractères maximum)

**201**
```json
{ "avis": { ... }, "restaurant": { "note": 4.7, "nombreAvis": 12 } }
```

**Erreurs** :
- 403 — la commande n'appartient pas à l'appelant
- 409 — la commande n'est pas au statut `livrée`
- 409 — cette commande a déjà été notée (index unique sur `commandeId`)

### GET /commandes/:id/avis
Renvoie l'avis existant ou `{ "avis": null }`.

---

# 6. Discussion — 🔒

### GET /commandes/:id/messages
**200** — `{ "messages": [ { "_id", "texte", "createdAt", "auteurId": { "nom", "role" } } ] }`

### POST /commandes/:id/messages
**Corps** — `{ "texte": "string (1–1000)" }`

**201** — `{ "message": {...} }` · **409** si la commande est annulée

**Effet temps réel** : `discussion:nouveau-message` dans le salon `commande:<id>`.

---

# 7. Menu géré par le restaurant — `/mon-restaurant` 🔒 rôle `restaurant`

Le gestionnaire n'indique jamais quel établissement il gère : c'est son compte
qui le détermine. Il n'y a donc aucun identifiant à falsifier dans l'URL.

### GET /mon-restaurant
**200** — `{ "restaurant": {...}, "plats": [...] }`

Contrairement à la vue client, les plats **indisponibles sont inclus** : le
gestionnaire doit pouvoir les remettre au menu.

**Erreurs** : 400 (compte non rattaché à un restaurant), 403 (autre rôle)

### PUT /mon-restaurant
Modifie la fiche de l'établissement.

Champs acceptés : `nom`, `cuisine`, `description`, `image`, `adresse`,
`delai`, `fraisLivraison`.

> `actif` est **ignoré** pour ce rôle : rendre un établissement visible reste
> une prérogative de l'administration. `note` et `nombreAvis` ne sont jamais
> acceptés en écriture — ils sont calculés à partir des avis réels.

**Erreurs** : 400 (aucun champ, valeur invalide), 409 (nom déjà pris)

---

### GET /mon-restaurant/plats
**200** — `{ "restaurant": {...}, "plats": [...] }`

### POST /mon-restaurant/plats
**Corps**
```json
{
  "nom": "Pizza burrata",
  "description": "Tomates rôties, burrata et basilic",
  "prix": 20,
  "categorie": "Pizzas",
  "image": "https://...",
  "populaire": false,
  "options": [
    { "nom": "Grand format", "prix": 5 },
    { "nom": "Base épicée", "prix": 0 }
  ]
}
```

Règles de validation : nom et catégorie d'au moins 2 caractères, image en
`http`/`https`, prix strictement positif et inférieur à 1000, 20 options
maximum, pas deux options de même nom, supplément entre 0 et 500.

**201** — `{ "plat": {...} }` · **400** si une règle n'est pas respectée

### PUT /mon-restaurant/plats/:platId
Modification partielle : seuls les champs envoyés sont pris en compte.

**Erreurs** : 400 (aucun champ, valeur invalide), 403 (plat d'un autre
restaurant), 404

### DELETE /mon-restaurant/plats/:platId
**Ne supprime pas le plat** : il est rendu indisponible et retiré du menu
client. Des commandes passées le référencent — les effacer casserait
l'historique.

**200** — `{ "message": "Plat retiré du menu", "plat": {...} }`

---

# 8. Notifications — `/notifications` 🔒

### POST /notifications/appareil
Enregistre le jeton de notification de l'appareil. Appelée après acceptation
de l'utilisateur, à la connexion et à chaque restauration de session.

**Corps** — `{ "jeton": "ExponentPushToken[...]", "plateforme": "android" }`

**201** — `{ "message": "Appareil enregistré", "appareil": {...} }`
**400** — le jeton n'a pas le format Expo attendu

Un même appareil peut changer de compte : la clé unique est le jeton, qui est
alors réattribué au nouvel utilisateur.

### DELETE /notifications/appareil
Retire l'appareil. Appelée à la déconnexion, pour qu'il ne reçoive plus les
notifications d'un compte auquel il n'est plus connecté.

**Corps** — `{ "jeton": "ExponentPushToken[...]" }`

---

# 9. Administration — `/admin` 🔒 rôle `admin`

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/admin/statistiques` | Compteurs utilisateurs, restaurants, commandes et revenus |
| GET | `/admin/utilisateurs` | Liste filtrable (`role`, `recherche`) |
| PATCH | `/admin/utilisateurs/:id/role` | Change le rôle d'un compte |
| DELETE | `/admin/utilisateurs/:id` | Supprime un compte (pas le sien) |
| POST | `/admin/restaurants` | **Crée un établissement**, et éventuellement son compte gestionnaire |
| PUT | `/admin/restaurants/:id` | Modifie la fiche d'un établissement |
| GET | `/admin/restaurants` | Liste filtrable (`actif`, `recherche`) |
| GET | `/admin/restaurants/:restaurantId/plats` | Menu complet d'un établissement |
| POST | `/admin/restaurants/:restaurantId/plats` | Ajoute un plat à un établissement |
| PUT | `/admin/plats/:platId` | Modifie un plat |
| DELETE | `/admin/plats/:platId` | Retire un plat (`?definitive=true` pour supprimer réellement) |
| PATCH | `/admin/restaurants/:id/actif` | Active ou désactive un restaurant |
| DELETE | `/admin/restaurants/:id` | Supprime un restaurant |
| GET | `/admin/commandes` | Liste filtrable (`statut`, `restaurantId`, `livreurId`) |
| PATCH | `/admin/commandes/:id/annuler` | Annule une commande |

### POST /admin/restaurants — détail

Un restaurant, ce sont **deux objets** : la fiche visible par les clients, et
le compte du gestionnaire qui fera évoluer les statuts. Cette route crée les
deux en une fois.

**Corps**
```json
{
  "nom": "Trattoria Bella",
  "cuisine": "Cuisine italienne",
  "description": "Une table italienne moderne.",
  "image": "https://...",
  "adresse": "1420 rue Sainte-Catherine Ouest, Montréal",
  "delai": "25–35 min",
  "fraisLivraison": 2.99,
  "gestionnaire": {
    "nom": "Gestion Bella",
    "courriel": "gestion@bella.ca",
    "motDePasse": "motdepasse1"
  }
}
```

Le bloc `gestionnaire` est facultatif. S'il est fourni :

- courriel **inconnu** → un compte de rôle `restaurant` est créé et rattaché ;
- courriel **déjà existant** → ce compte est promu gestionnaire de ce restaurant.

**201**
```json
{
  "restaurant": { "...": "..." },
  "gestionnaire": { "id": "...", "nom": "...", "courriel": "..." }
}
```

**Erreurs** : 400 (champ invalide, mot de passe trop court), 409 (nom déjà pris)

> Sans gestionnaire, personne ne pourra faire évoluer les commandes de cet
> établissement : elles resteront bloquées au statut « en attente ».

---

# 10. Événements Socket.IO

Connexion authentifiée par le même jeton JWT :

```js
io(SOCKET_URL, { auth: { token } });
```

Un socket sans jeton valide est refusé à la poignée de main.

### Émis par le client

| Événement | Charge | Effet |
|-----------|--------|-------|
| `commande:rejoindre` | `commandeId` | Rejoint le salon de la commande |
| `commande:quitter` | `commandeId` | Quitte le salon |

### Émis par le serveur

| Événement | Destinataires | Quand |
|-----------|---------------|-------|
| `commande:nouvelle` | restaurant, admin | Une commande est créée |
| `commande:disponible` | tous les livreurs | Une commande passe à `prête` sans livreur |
| `commande:attribuee` | client, restaurant, livreur | Un livreur accepte |
| `commande:mise-a-jour` | parties concernées | Tout changement de statut |
| `commande:notee` | parties concernées | Un avis est déposé |

À chaque événement de commande, le serveur envoie **également** une
notification poussée aux parties concernées (voir section 8). Les deux canaux
sont indépendants : Socket.IO met l'écran à jour, la notification atteint
l'appareil même application fermée.
| `discussion:nouveau-message` | salon `commande:<id>` | Nouveau message |

---

# 11. Tester avec Postman ou curl

```bash
# Inscription
curl -X POST http://localhost:3000/api/auth/inscription \
  -H "Content-Type: application/json" \
  -d '{"nom":"Archange","courriel":"a@test.ca","motDePasse":"motdepasse1"}'

# Catalogue
curl http://localhost:3000/api/restaurants

# Commande (jeton obtenu à l'étape précédente)
curl -X POST http://localhost:3000/api/commandes \
  -H "Authorization: Bearer $JETON" -H "Content-Type: application/json" \
  -d '{"restaurantId":"...","plats":[{"platId":"...","quantite":1}],
       "adresseLivraison":"123 rue Exemple, Montréal","methodePaiement":"livraison"}'
```

Carte de test acceptée dans les deux modes : **4242 4242 4242 4242**,
expiration future (`12/30`), CVV `123`.
