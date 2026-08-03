# User stories — livreur et restaurant

## US-05 — Recevoir les commandes en temps réel (restaurant)

> En tant que **gestionnaire de restaurant**, je veux voir arriver les nouvelles
> commandes sans rafraîchir, afin de commencer la préparation sans délai.

**Critères d'acceptation**

- Une commande passée par un client apparaît en moins de 5 secondes sans action
  de ma part.
- Je ne vois que les commandes de mon établissement.
- Je peux faire passer une commande de « en attente » à « confirmée »,
  « en préparation » puis « prête ».
- Je peux annuler une commande tant qu'elle n'est pas « prête ».
- Une tentative d'accès à la commande d'un autre restaurant renvoie 403.

## US-06 — Accepter une livraison (livreur)

> En tant que **livreur**, je veux voir les commandes prêtes et en accepter une,
> afin d'organiser ma tournée.

**Critères d'acceptation**

- La liste ne contient que les commandes au statut « prête » sans livreur assigné.
- Si deux livreurs acceptent la même commande, un seul l'obtient ; l'autre
  reçoit un message clair et la commande disparaît de sa liste.
- Après acceptation, je peux passer « en route » puis « livrée ».
- Le client et le restaurant voient chaque changement en direct.

**Hors périmètre, assumé**

- Les courses ne sont pas filtrées par proximité : tous les livreurs voient
  toutes les commandes prêtes.
- Si personne n'accepte, la commande reste disponible indéfiniment ; aucune
  relance ni réattribution automatique.
- Un livreur ne peut pas se désister après acceptation ; seul un
  administrateur peut annuler la commande.

## US-07 — Discuter au sujet d'une commande

> En tant que **client**, je veux échanger avec le restaurant ou le livreur au
> sujet de ma commande, afin de préciser une consigne de livraison.

**Critères d'acceptation**

- La discussion est rattachée à une commande précise.
- Seuls le client, le restaurant concerné, le livreur assigné et
  l'administration peuvent y accéder.
- Les messages apparaissent en direct des deux côtés.
- Un message vide ou de plus de 1000 caractères est refusé.

## US-08 — Superviser la plateforme (administrateur)

> En tant qu'**administrateur**, je veux consulter l'activité et intervenir sur
> les comptes, afin de garder la plateforme saine.

**Critères d'acceptation**

- Je vois le nombre d'utilisateurs par rôle, de restaurants actifs, de commandes
  par statut et le revenu des commandes livrées.
- Je peux changer le rôle d'un utilisateur, supprimer un compte (sauf le mien),
  désactiver un restaurant et annuler une commande.
- Toutes ces routes renvoient 403 à un compte non administrateur.
