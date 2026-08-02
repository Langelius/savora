# Architecture du système

## Vue d'ensemble

L'application suit une architecture **client-serveur** moderne : une application
mobile React Native communique avec un backend Node.js/Express via une API REST (HTTPS)
et un canal temps réel (Socket.IO). Le backend s'appuie sur MongoDB pour le
stockage, Stripe pour le paiement (mode test) et Google Maps pour la
géolocalisation.

## Schéma

![Architecture du système](./diagrammes/architecture.svg)

*Figure 1 — Architecture client-serveur de l'application.*

## Composants

| Composant | Technologie | Rôle |
|-----------|-------------|------|
| Application mobile | React Native (JS) | Interface client (Android + iOS) |
| Serveur / API | Node.js + Express | Logique métier, routes REST |
| Base de données | MongoDB | Stockage des données |
| Temps réel | Socket.IO | Suivi de commande en direct |
| Paiement | Stripe (sandbox) | Transactions en mode test |
| Géolocalisation | Google Maps API | Cartes et distances |
| Authentification | JWT + bcrypt | Sessions et mots de passe |

## Flux principal d'une commande

![Parcours d'une commande](./diagrammes/sequence_commande.svg)

*Figure 3 — Du panier au paiement, puis suivi en temps réel et notation.*

Étapes résumées :

1. Le client compose son panier et passe commande (`POST /commandes`).
2. Le backend enregistre la commande puis déclenche le paiement Stripe.
3. Après confirmation du paiement, le statut passe à « en préparation ».
4. À chaque changement de statut côté restaurant, le backend pousse la mise à
   jour au client via Socket.IO.
5. Après livraison, le client note le restaurant (`POST /avis`).
