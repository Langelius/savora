# ADR 0003 — TypeScript et Expo Router côté mobile

- **Statut** : accepté (rétroactif — décision prise au Sprint 2, documentée en août 2026)
- **Date** : 2026-08-02

## Contexte

Le cahier des charges v2 imposait « React Native (JavaScript) » avec
`react-navigation`. Au moment de construire les écrans, deux problèmes sont
apparus :

1. Les réponses de l'API sont des objets imbriqués (une commande contient un
   restaurant peuplé, un livreur éventuellement nul, un tableau de lignes). En
   JavaScript, chaque accès du type `commande.restaurantId.nom` était une source
   d'erreur au moment de l'exécution, découverte seulement au test manuel.
2. Le projet compte quatre espaces distincts (client, restaurant, livreur,
   administration) et une quinzaine d'écrans. La configuration manuelle des
   piles `react-navigation` devenait longue et redondante.

## Décision

- **TypeScript** pour toute l'application mobile.
- **Expo Router** (routage par fichiers) à la place de `react-navigation`
  configuré à la main.
- **Context API seule**, sans Redux.

## Conséquences

**Positives**

- Les formes de données de l'API sont décrites une fois dans `services/api.ts`
  et vérifiées à la compilation. `npm run typecheck` détecte les régressions
  avant l'exécution.
- Un nouvel écran = un nouveau fichier dans `src/app/`. Aucune configuration
  de navigation à maintenir.
- L'état partagé se limite à la session et au panier : deux contextes de moins
  de 120 lignes chacun. Redux aurait ajouté de la cérémonie sans bénéfice.

**Négatives**

- Écart documenté par rapport au cahier des charges v2, qui a dû être révisé.
- Expo Router impose sa convention de dossiers ; le projet reste dans
  l'écosystème Expo, ce qui complique une éventuelle éjection.
- L'équipe a dû monter en compétence sur TypeScript en cours de sprint.

## Alternatives écartées

- **Rester en JavaScript** : conforme au cahier, mais les erreurs de forme de
  données se répétaient à chaque écran.
- **Redux Toolkit** : disproportionné pour deux morceaux d'état.
