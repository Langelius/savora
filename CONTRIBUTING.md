# Guide de contribution — Global SoftCorporation

Ce document résume comment travailler ensemble sur le projet. **Tout le monde le
lit avant de pousser du code.** En cas de doute, on suit ce qui est écrit ici.

---

## 1. Principe général

> **Jira** gère le *quoi* et le *quand* (backlog, sprints, statut).
> **GitHub** gère le *comment* (code, doc, revue).
> La **clé d'issue Jira** (ex. `MEAL-12`) relie les deux.

Règle d'or : **personne ne pousse directement sur `main`.** Tout passe par une
branche puis une Pull Request révisée.

---

## 2. Les branches

| Branche | Rôle |
|---------|------|
| `main` | Version stable, déployable. **Protégée** : fusion uniquement par PR approuvée. |
| `develop` | Branche d'intégration. C'est de là qu'on part et qu'on fusionne. |
| `feature/...` | Une branche par tâche, créée à partir de `develop`. |

Nom d'une branche de fonctionnalité : `feature/<CLE-JIRA>-description-courte`

```
feature/MEAL-12-menu-interactif
feature/MEAL-18-paiement-stripe
```

---

## 3. Le cycle de travail (à répéter pour chaque tâche)

```bash
# 1. Partir d'un develop à jour
git checkout develop
git pull

# 2. Créer sa branche de tâche
git checkout -b feature/MEAL-12-menu-interactif

# 3. Travailler, puis enregistrer ses changements
git add .
git commit -m "feat: afficher la liste des plats d'un restaurant (MEAL-12)"

# 4. Publier sa branche
git push -u origin feature/MEAL-12-menu-interactif

# 5. Ouvrir une Pull Request sur GitHub (vers develop)
```

Quand la PR est approuvée et fusionnée, on supprime la branche et on recommence.

---

## 4. Les messages de commit (Conventional Commits)

Format : `type: description à l'impératif (CLE-JIRA)`

| Type | Quand l'utiliser |
|------|------------------|
| `feat:` | nouvelle fonctionnalité |
| `fix:` | correction de bug |
| `docs:` | documentation seulement |
| `refactor:` | réorganisation sans changement de comportement |
| `test:` | ajout ou modification de tests |
| `chore:` | configuration, dépendances, tâches techniques |

Exemples :
```
feat: ajouter le suivi de commande en temps réel (MEAL-20)
fix: corriger le calcul du total avec les taxes (MEAL-15)
docs: documenter l'endpoint POST /commandes (MEAL-12)
```

---

## 5. Les Pull Requests

- La PR cible **`develop`** (jamais `main` directement).
- Le titre reprend la clé Jira : `MEAL-12 — Menu interactif`.
- Le modèle de PR (rempli automatiquement) contient la checklist à cocher.
- **Au moins un autre équipier** doit approuver avant la fusion.
- On répond aux commentaires plutôt que de fusionner en force.

> Astuce : garder les PR **petites**. Une PR = une tâche. C'est plus facile à
> relire et ça évite les gros conflits.

---

## 6. Definition of Done (une tâche n'est terminée que si…)

- [ ] Le code fonctionne et a été testé localement.
- [ ] La PR est **approuvée** par au moins un équipier.
- [ ] Les tests passent (CI verte).
- [ ] La **documentation `/docs` est à jour** dans la même PR.
- [ ] L'**issue Jira est passée en « Terminé »**.

---

## 7. Résoudre un conflit (rapide)

Si Git signale un conflit en fusionnant `develop` dans ta branche :

```bash
git checkout feature/ma-branche
git pull origin develop        # récupère les derniers changements
# ... Git indique les fichiers en conflit ...
# ouvre chaque fichier, garde la bonne version, retire les marqueurs <<<< ==== >>>>
git add <fichiers-resolus>
git commit
git push
```

En cas de doute sur un conflit, **demander à l'équipe sur Discord** avant de
forcer quoi que ce soit.

---

## 8. À ne jamais faire

-  Pousser directement sur `main`.
-  Committer le fichier `.env` (il est dans `.gitignore`, on n'y touche pas).
-  Fusionner sa propre PR sans relecture.
-  `git push --force` sur `develop` ou `main`.

---

## 9. Rôles de l'équipe

| Membre | Rôle technique | Chapeau Scrum |
|--------|----------------|----------------|
| JORDAN | Lead technique / Backend | Scrum Master |
| YAN | Frontend React Native | Développement |
| WILFRED | Intégrations & temps réel | Développement |
| ARCHANGE | QA / DevOps / Coordination doc | Product Owner |

---

*Questions ? On en parle au daily (asynchrone sur Discord) ou à la synchro
hebdomadaire.*
