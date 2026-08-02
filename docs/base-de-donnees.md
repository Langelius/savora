# Base de données (MongoDB)

## Schéma

![Schéma de la base de données](./diagrammes/schema_mongodb.svg)

*Figure 2 — Collections MongoDB et relations.*

## Collections

### Collection `utilisateurs`
| Champ | Type | Description |
|-------|------|-------------|
| _id | ObjectId | Identifiant unique (PK) |
| nom | String | Nom complet |
| courriel | String | Adresse courriel (unique) |
| motDePasse | String | Haché avec bcrypt |
| adresse | String | Adresse de livraison |
| role | String | `client` ou `restaurant` |

### Collection `restaurants`
| Champ | Type | Description |
|-------|------|-------------|
| _id | ObjectId | Identifiant unique (PK) |
| nom | String | Nom du restaurant |
| adresse | String | Adresse |
| categorie | String | pizza, burger, végétarien… |
| noteMoyenne | Number | Moyenne des avis |
| horaires | Object | Heures d'ouverture |

### Collection `plats`
| Champ | Type | Description |
|-------|------|-------------|
| _id | ObjectId | Identifiant unique (PK) |
| restaurantId | ObjectId | Référence vers `restaurants` (FK) |
| nom | String | Nom du plat |
| prix | Number | Prix de base |
| description | String | Description |
| options | Array | Suppléments, tailles, sauces |

### Collection `commandes`
| Champ | Type | Description |
|-------|------|-------------|
| _id | ObjectId | Identifiant unique (PK) |
| utilisateurId | ObjectId | Référence vers `utilisateurs` (FK) |
| restaurantId | ObjectId | Référence vers `restaurants` (FK) |
| plats | Array | Articles commandés (items + options) |
| total | Number | Montant total |
| statut | String | en attente, en préparation, en route, livrée |
| dateCommande | Date | Horodatage |

### Collection `avis`
| Champ | Type | Description |
|-------|------|-------------|
| _id | ObjectId | Identifiant unique (PK) |
| utilisateurId | ObjectId | Référence vers `utilisateurs` (FK) |
| restaurantId | ObjectId | Référence vers `restaurants` (FK) |
| commandeId | ObjectId | Référence vers `commandes` (FK) |
| note | Number | Note de 1 à 5 |
| commentaire | String | Commentaire facultatif |
| date | Date | Horodatage |

## Relations

- Un `utilisateur` passe plusieurs `commandes` (1–N).
- Un `restaurant` propose plusieurs `plats` (1–N).
- Un `restaurant` reçoit plusieurs `commandes` et `avis` (1–N).
- Une `commande` livrée donne lieu à un `avis` au maximum.

> Remarque : poser un index **unique** sur `commandeId` dans `avis` pour garantir
> un seul avis par commande.
