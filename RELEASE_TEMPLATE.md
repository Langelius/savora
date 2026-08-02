# Modèle de notes de release

Copier le bloc ci-dessous à chaque fin de sprint, dans la description de la
release GitHub (onglet **Releases → Draft a new release**). Remplir les
`[crochets]` et supprimer ce paragraphe d'introduction.

> **Rappel :** une release = un sprint. Le tag marque le commit exact de fin de
> sprint sur `main`. Conventions de tags : `v0.1.0` (Sprint 1), `v0.2.0`
> (Sprint 2), `v1.0.0` (Sprint 3 / version finale).

---

## Bloc à copier

```
## [Titre du sprint — ex. Sprint 1 : Fondations & authentification]

**Période :** semaines [X à Y]

### ✅ Fonctionnalités livrées
- [Fonctionnalité 1]
- [Fonctionnalité 2]
- [Fonctionnalité 3]

### 📄 Documentation mise à jour
- [Ex. architecture.md, base-de-donnees.md, ADR…]

### 📊 Vélocité réalisée
[XX] points sur [YY] planifiés

### 🐞 Connu / à améliorer
- [Bugs connus, dette technique, points reportés au sprint suivant]

### 👥 Contributions
Généré automatiquement via « Generate release notes » (liste des PR fusionnées).
```

---

## Exemples pré-remplis (pour référence)

### Sprint 1 — `v0.1.0`
```
## Sprint 1 — Fondations & authentification

**Période :** semaines 1 à 4

### ✅ Fonctionnalités livrées
- Backend Express connecté à MongoDB
- Inscription / connexion (JWT + bcrypt)
- Écrans mobile de connexion et d'inscription

### 📄 Documentation mise à jour
- Architecture et schéma de base de données
- ADR des choix techniques (React Native, MongoDB)

### 📊 Vélocité réalisée
25 points sur 25 planifiés

### 🐞 Connu / à améliorer
- (points reportés au Sprint 2)
```

### Sprint 2 — `v0.2.0`
```
## Sprint 2 — Menu interactif, commande & paiement

**Période :** semaines 5 à 8

### ✅ Fonctionnalités livrées
- Menu interactif avec personnalisation des plats
- Panier et calcul du total
- Passage de commande et paiement Stripe (mode test)

### 📄 Documentation mise à jour
- Documentation des endpoints (/docs/api)
- ADR du flux de paiement

### 📊 Vélocité réalisée
[XX] points sur 39 planifiés

### 🐞 Connu / à améliorer
- [à compléter]
```

### Sprint 3 — `v1.0.0`
```
## Sprint 3 — Suivi temps réel, notation & livraison finale

**Période :** semaines 9 à 12

### ✅ Fonctionnalités livrées
- Suivi de commande en temps réel (Socket.IO)
- Notation des restaurants
- Stabilisation, optimisation et corrections

### 📄 Documentation mise à jour
- Documentation finale complète
- Rapport de projet (dans /livrables)

### 📊 Vélocité réalisée
[XX] points sur 37 planifiés

### 🐞 Connu / à améliorer
- Perspectives d'amélioration : app livreur, app admin, chat, modération
```

---

## Comment créer la release (rappel express)

```bash
git checkout main && git pull
git tag -a v0.1.0 -m "Fin du Sprint 1"
git push origin v0.1.0
```

Puis sur GitHub : **Releases → Draft a new release → Choose a tag (v0.1.0) →**
coller le bloc rempli → **Publish release**.
