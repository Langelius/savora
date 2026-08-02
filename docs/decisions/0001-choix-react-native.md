# ADR 0001 — Choix de React Native pour le mobile

- **Statut :** Accepté
- **Date :** 2026-06-21
- **Décideurs :** Équipe Global SoftCorporation + enseignant

## Contexte
L'application doit fonctionner sur Android et iOS dans un temps limité.

## Décision
Utiliser **React Native (JavaScript)** avec une base de code unique pour les
deux plateformes. Choix confirmé après discussion avec l'enseignant.

## Alternatives envisagées
- Flutter (Dart) — écarté : l'équipe est déjà familière de l'écosystème
  JavaScript (backend Node.js), ce qui réduit la courbe d'apprentissage.
- Développement natif séparé (Kotlin + Swift) — rejeté : double effort, hors délais.

## Conséquences
- Une seule base de code à maintenir.
- Cohérence du langage (JavaScript) entre le backend et le mobile.
- Possibilité d'utiliser Expo pour simplifier le démarrage.
