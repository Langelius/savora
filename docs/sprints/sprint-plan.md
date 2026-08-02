# Plan de sprints et organisation Scrum

> **Projet :** Application de livraison de repas (React Native · Node.js · MongoDB)
> **Équipe :** Global SoftCorporation (4 personnes)
> **Cadence :** 3 sprints de 4 semaines (12 semaines)

---

## 1. Rôles Scrum

À 4 personnes, chacun porte un « chapeau » Scrum **en plus** de son rôle de
développeur. Tout le monde code.

| Membre | Rôle technique | Chapeau Scrum |
|--------|----------------|----------------|
| JORDAN | Lead technique / Backend | **Scrum Master** — anime les cérémonies, lève les obstacles |
| YAN | Frontend React Native | Développement |
| WILFRED | Intégrations & temps réel | Développement |
| ARCHANGE | QA / DevOps / Coordination doc | **Product Owner** — possède le backlog, priorise, valide |

---

## 2. Vue d'ensemble des sprints

| Sprint | Semaines | Objectif (incrément démontrable) | Points |
|--------|----------|----------------------------------|:------:|
| **Sprint 1** | 1–4 | Cadrage + fondations + **authentification** (dépôt, Jira, architecture, backend, maquettes) | 25 |
| **Sprint 2** | 5–8 | **Menu interactif** + panier + **commande & paiement Stripe** (Fonctionnalités 1 et 3) | 39 |
| **Sprint 3** | 9–12 | **Suivi temps réel** + **notation** + stabilisation et démo (Fonctionnalités 2 et 4) | 37 |

*Total : 101 story points sur 3 sprints.*

Chaque sprint doit livrer un **incrément démontrable** : à la fin du Sprint 2,
on montre une commande qu'on peut composer et payer, pas « du code commencé ».

> **Sprints de 4 semaines :** comme la boucle de feedback est plus longue qu'avec
> des sprints courts, on prévoit une **revue à mi-sprint** (fin de semaine 2 de
> chaque sprint) pour vérifier l'avancement et réajuster si besoin.

---

## 3. Les epics

Le backlog est organisé en 7 epics, mappés sur les fonctionnalités imposées :

1. **Infrastructure & Documentation** — dépôt, Jira, architecture, docs *(Sprint 1)*
2. **Authentification** — inscription, connexion (JWT, bcrypt) *(Sprint 1)*
3. **Menu interactif** — restaurants, plats, personnalisation, panier *(Sprint 2 — Fonctionnalité 1)*
4. **Commande & Paiement** — commande + Stripe sandbox *(Sprint 2 — Fonctionnalité 3)*
5. **Suivi temps réel** — Socket.IO *(Sprint 3 — Fonctionnalité 2)*
6. **Notation** — avis et note moyenne *(Sprint 3 — Fonctionnalité 4)*
7. **Stabilisation & Livraison** — tests, perf, rapport, démo *(Sprint 3)*

---

## 4. Les cérémonies

| Cérémonie | Quand | Durée | Comment |
|-----------|-------|-------|---------|
| **Sprint Planning** | Début de sprint | ~1 h | Le PO présente les stories prioritaires ; l'équipe en sélectionne et les estime. |
| **Daily Scrum** | Chaque jour | 5 min | **Asynchrone** sur Discord (`#daily`) : hier / aujourd'hui / bloqué par. |
| **Revue à mi-sprint** | Semaine 2 du sprint | ~20 min | Point d'avancement, réajustement du périmètre si nécessaire. |
| **Sprint Review** | Fin de sprint | ~30 min | Démo de l'incrément, idéalement devant l'enseignant. |
| **Rétrospective** | Fin de sprint | ~30 min | Ce qui a marché, ce qui a coincé, une amélioration. |

---

## 5. Estimation en story points

On estime les **stories** (pas les sous-tâches) en suite de Fibonacci :
**1, 2, 3, 5, 8**. On utilise le *planning poker* : chacun propose en même temps,
on discute les écarts.

| Points | Signification |
|:------:|---------------|
| 1–2 | Tâche simple, quelques heures |
| 3 | Tâche moyenne, bien comprise |
| 5 | Conséquente, demande de la réflexion |
| 8 | Grosse story — envisager de la découper |

> **Charge des sprints :** avec 3 sprints de 4 semaines, chaque sprint porte
> beaucoup de points (25 à 39). Découpez le travail semaine par semaine à
> l'intérieur du sprint et suivez l'avancement de près, pour ne pas tout
> repousser à la fin du sprint.

---

## 6. Le tableau Jira

Colonnes du board, alignées sur le workflow GitHub :

```
Backlog → À faire → En cours → En revue → Terminé
                                  ▲
                         = Pull Request ouverte
```

**Definition of Done** (une story n'est terminée que si…) :

- [ ] Code testé localement
- [ ] PR approuvée par un équipier (CI verte)
- [ ] Documentation `/docs` à jour dans la même PR
- [ ] L'issue Jira est passée en « Terminé »

---

## 7. Relier Jira et GitHub

Chaque issue Jira reçoit une **clé** (ex. `MEAL-12`). On la réutilise partout :

```
Branche : feature/MEAL-12-menu-interactif
Commit  : feat: afficher la liste des plats (MEAL-12)
PR      : MEAL-12 — Menu interactif
```

Il faut installer l'application **GitHub for Jira** (gratuite, Marketplace Atlassian)
pour que Jira affiche automatiquement les commits et PR liés à chaque ticket.

---

## 8. Démarrage concret (première semaine)

1. Importer le backlog dans Jira.
2. Créer les 3 sprints dans le board si l'import ne les a pas générés.
3. Lancer le **Sprint Planning du Sprint 1** : l'équipe s'engage sur les stories
   du Sprint 1 (cadrage + fondations + authentification).
4. Chacun crée sa branche `feature/MEAL-xx-...` et commence.
5. Daily asynchrone dans `#daily` dès le lendemain.

