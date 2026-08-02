# ADR 0002 — Choix de MongoDB

- **Statut :** Accepté
- **Date :** 2026-06-21
- **Décideurs :** Équipe Global SoftCorporation

## Contexte
Les données (commandes, menus, options) sont flexibles et évoluent souvent.

## Décision
Utiliser **MongoDB**, base NoSQL orientée documents.

## Alternatives envisagées
- PostgreSQL — rejetée : schéma plus rigide pour des documents imbriqués (plats + options).

## Conséquences
- Souplesse pour les sous-documents (articles d'une commande).
- Pas de jointures natives : les références sont gérées côté application.
