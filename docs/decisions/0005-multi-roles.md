# ADR 0005 — Élargissement du périmètre aux quatre rôles

- **Statut** : accepté (rétroactif — documenté en août 2026)
- **Date** : 2026-08-02

## Contexte

Le cahier des charges v2 classait l'application livreur, le tableau de bord
administrateur et la discussion en **« Won't have »**, hors périmètre du MVP.
Seule une « interface restaurant minimale » était prévue pour démontrer le
suivi temps réel.

En construisant cette interface restaurant, l'équipe a constaté que le suivi
en temps réel — fonctionnalité 2, imposée — n'était pas réellement
démontrable : le statut s'arrêtait à « prête ». Les statuts « en route » et
« livrée », visibles par le client, n'avaient personne pour les déclencher.
Le cœur du cahier des charges dépendait donc d'un acteur déclaré hors périmètre.

## Décision

Élargir le périmètre à quatre rôles portés par **une seule application mobile**,
avec redirection après connexion selon le rôle :

| Rôle | Écran d'entrée |
|------|----------------|
| `client` | `/restaurants` |
| `restaurant` | `/restaurant-dashboard` |
| `livreur` | `/livreur-dashboard` |
| `admin` | `/admin-dashboard` |

Une seule base de code, un seul déploiement. Les autorisations sont appliquées
côté serveur par le middleware `autoriserRoles` et par des vérifications de
propriété dans chaque contrôleur — jamais par le simple masquage d'un bouton.

## Conséquences

**Positives**

- Le suivi temps réel devient démontrable de bout en bout, du panier à la
  livraison, ce qui était l'objectif du cahier des charges.
- Le cycle de vie complet d'une commande est couvert et traçable
  (`historiqueStatuts`).
- La discussion par commande, née du même besoin (« où est mon livreur ? »),
  s'est intégrée naturellement au canal Socket.IO existant.

**Négatives**

- Périmètre nettement plus large que le MVP annoncé : le cahier des charges a
  dû être révisé en v3.0.
- La surface d'attaque augmente ; chaque route a demandé une règle
  d'autorisation explicite et vérifiée.
- Le temps consacré aux espaces restaurant, livreur et administration a retardé
  la notation, qui n'a été livrée qu'en fin de projet.

## Alternatives écartées

- **Rester au périmètre initial** : le suivi temps réel serait resté une
  démonstration artificielle.
- **Quatre applications distinctes** : quadruple le travail de configuration et
  de déploiement, pour une équipe de quatre personnes sur douze semaines.
