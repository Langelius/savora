# User stories — Parcours client

## US-01 : Menu interactif
**En tant que** client, **je veux** parcourir les plats et les personnaliser,
**afin de** composer exactement la commande que je souhaite.

**Critères d'acceptation :**
- [ ] Chaque plat affiche photo, prix et description.
- [ ] Les options modifient le prix affiché en direct.
- [ ] Le plat personnalisé peut être ajouté au panier.

**Priorité (MoSCoW) :** Must

---

## US-02 : Suivi de commande
**En tant que** client, **je veux** suivre ma commande en temps réel,
**afin de** savoir quand elle arrive.

**Critères d'acceptation :**
- [ ] Les trois statuts (préparation, en route, livrée) sont visibles.
- [ ] La mise à jour survient en moins de 5 secondes.

**Priorité (MoSCoW) :** Must

---

## US-03 : Paiement
**En tant que** client, **je veux** payer ma commande en ligne,
**afin de** finaliser l'achat sans argent comptant.

**Critères d'acceptation :**
- [ ] Le paiement utilise Stripe en mode test.
- [ ] Une commande n'est confirmée que si le paiement réussit.

**Priorité (MoSCoW) :** Must

---

## US-04 : Notation
**En tant que** client, **je veux** noter le restaurant après livraison,
**afin de** partager mon expérience.

**Critères d'acceptation :**
- [ ] La notation n'est possible qu'après une commande livrée.
- [ ] La note moyenne du restaurant est recalculée.

**Priorité (MoSCoW) :** Must

---

## US-04 — Noter le restaurant après livraison

> En tant que **client**, je veux noter le restaurant après réception de ma
> commande, afin de partager mon expérience avec les autres clients.

**Critères d'acceptation**

- Le bouton « Noter le restaurant » n'apparaît qu'une fois la commande au
  statut « livrée ».
- La note est un entier de 1 à 5 ; le commentaire est facultatif (600
  caractères maximum).
- Une commande ne peut être notée qu'une seule fois. Une seconde tentative
  affiche l'avis existant en lecture seule.
- La note moyenne du restaurant et le nombre d'avis sont recalculés et visibles
  immédiatement sur sa fiche.
- Un client ne peut pas noter la commande d'un autre client (403).
