# Documentation technique — Savora

Toute la documentation vit ici, en Markdown, versionnée avec le code
(*docs-as-code*). Elle est mise à jour dans la **même Pull Request** que le
code qu'elle décrit.

## Sommaire

| Document | Contenu |
|----------|---------|
| [architecture.md](./architecture.md) | Vue d'ensemble technique, flux d'une commande, sécurité, limites connues |
| [base-de-donnees.md](./base-de-donnees.md) | Schémas MongoDB, index, machine à états |
| [api/README.md](./api/README.md) | Documentation complète des routes REST et des événements Socket.IO |
| [installation.md](./installation.md) | Installation, comptes de démonstration, dépannage |
| [decisions/](./decisions/) | Décisions d'architecture (ADR) |
| [user-stories/](./user-stories/) | User stories et critères d'acceptation |
| [sprints/sprint-plan.md](./sprints/sprint-plan.md) | Organisation Scrum et découpage des sprints |
| [tests/strategie-de-test.md](./tests/strategie-de-test.md) | Stratégie et couverture de test |
| [exploitation/guide-de-test.md](./exploitation/guide-de-test.md) | **Procédure complète de test du projet** |
| [exploitation/deploiement.md](./exploitation/deploiement.md) | **Déploiement sur Render ou Railway** |
| [exploitation/](./exploitation/) | Notes d'exploitation rédigées au fil des étapes |
| [rapport/README.md](./rapport/README.md) | Rapport de projet |
| [diagrammes/](./diagrammes/) | Diagrammes source (SVG) |

## Décisions d'architecture

| ADR | Sujet |
|-----|-------|
| [0001](./decisions/0001-choix-react-native.md) | Choix de React Native |
| [0002](./decisions/0002-choix-mongodb.md) | Choix de MongoDB |
| [0003](./decisions/0003-typescript-et-expo-router.md) | TypeScript et Expo Router |
| [0004](./decisions/0004-paiement-stripe-ou-simulation.md) | Paiement : Stripe en mode test avec repli |
| [0005](./decisions/0005-multi-roles.md) | Élargissement du périmètre aux quatre rôles |
| [0006](./decisions/0006-notifications-double-canal.md) | Notifications : push distantes et repli local |

## Règle d'or

> Pas de documentation à jour = la tâche n'est **pas** terminée.
