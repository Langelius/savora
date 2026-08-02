# Stratégie de test

## Principe

Les tests ne sont pas une étape de fin de projet : ils accompagnent chaque
tâche. Une tâche n'est « terminée » que si le code, les tests et la
documentation sont à jour dans la même Pull Request.

## Les quatre niveaux

| Niveau | Outil | Ce qui est couvert | Automatisé |
|--------|-------|--------------------|:----------:|
| Unitaire | `node --test` (module natif) | Règles métier pures : tarification, statuts, sécurité, validation du menu, notifications | ✅ |
| Statique | `tsc --noEmit` | Cohérence des types entre l'API et les écrans mobiles | ✅ |
| Intégration API | Postman / curl | Enchaînement des routes, codes de statut, autorisations | ⚠️ manuel |
| Acceptation | Parcours sur téléphone | Scénarios complets multi-rôles | ⚠️ manuel |

## Tests unitaires — `backend/tests/`

```bash
cd backend && npm test
```

**30 tests, 6 fichiers.** Ils ne demandent ni MongoDB ni réseau : les règles
métier ont été extraites dans `src/services/` précisément pour cela.

| Fichier | Ce qu'il vérifie |
|---------|------------------|
| `tarification.test.js` | Arrondis monétaires, suppléments d'options, taxes du Québec, panier vide. Vérifie notamment qu'une option inventée par un client malveillant est ignorée. |
| `statutsCommande.test.js` | Le cycle de vie complet est autorisé ; on ne peut ni sauter une étape, ni repartir d'un état terminal, ni annuler une commande déjà prête ; chaque rôle ne pose que les statuts qui le concernent. |
| `securite.test.js` | Échappement des expressions régulières (ReDoS), limitation de débit à 429, validation et expiration des cartes. |
| `asynchrone.test.js` | Une promesse rejetée dans un contrôleur atteint bien le middleware d'erreurs — c'était le bug le plus grave corrigé sur le projet. |
| `menu.test.js` | La note d'un restaurant ne peut pas être imposée dans un formulaire ; un prix nul ou négatif est refusé ; deux options de même nom sont rejetées ; une modification partielle n'exige pas tous les champs. |
| `notifications.test.js` | Chaque statut visible par le client produit un message ; le statut initial n'en produit aucun ; un jeton hors format Expo est refusé ; le message reste lisible quand le restaurant n'est pas peuplé. |

## Vérification statique — mobile

```bash
cd mobile/App-Client && npm run typecheck
```

Les formes de données de l'API sont décrites une seule fois dans
`src/services/api.ts`. Un champ renommé côté serveur fait échouer la
compilation des écrans concernés, avant toute exécution.

## Tests d'intégration manuels

Scénario de référence, à rejouer avant chaque démonstration :

1. **Client** — inscription, parcours du catalogue, personnalisation d'un plat,
   ajout au panier, paiement par carte de test. → commande créée, statut
   « en attente ».
2. **Restaurant** (autre appareil) — la commande apparaît **sans
   rafraîchissement**. Passage à « confirmée », « en préparation », « prête ».
3. **Livreur** — la commande apparaît dans les livraisons disponibles.
   Acceptation, puis « en route », puis « livrée ».
4. **Client** — chaque étape s'affiche en direct. Le bouton « Noter le
   restaurant » apparaît une fois la commande livrée.
5. **Notation** — dépôt d'un avis. La note moyenne du restaurant est mise à jour.
6. **Administrateur** — les statistiques reflètent la nouvelle commande.

### Cas d'erreur à démontrer

| Test | Résultat attendu |
|------|------------------|
| Deux livreurs acceptent la même commande | Un seul l'obtient, l'autre reçoit **409** |
| Un restaurant consulte la commande d'un autre établissement | **403** |
| Noter deux fois la même commande | **409** |
| Noter une commande non livrée | **409** |
| Carte `4000 0000 0000 0002` (mode Stripe) | **402**, panier conservé |
| 11 tentatives de connexion en 15 minutes | **429** |
| Recherche `(a+)+$` dans le catalogue | Réponse immédiate, aucun blocage |
| Un gestionnaire modifie le plat d'un autre restaurant | **403** |
| Une note de 5 est imposée à la création d'un restaurant | Ignorée : le restaurant est créé avec une note de 0 |
| Un jeton de notification hors format Expo | **400** |
| `npm run seed` après création d'un restaurant depuis l'application | Le restaurant créé est conservé |

## Intégration continue

`.github/workflows/ci.yml` exécute à chaque *push* et chaque Pull Request sur
`main` et `develop` :

1. `npm ci` puis `npm test` sur le backend ;
2. `npm ci` puis `npm run typecheck` sur l'application mobile.

## Ce qui n'est pas couvert

Nous préférons l'énoncer plutôt que de le laisser croire :

- Aucun test d'intégration **automatisé** sur les routes HTTP (il faudrait
  Supertest et une base MongoDB en mémoire).
- Aucun test d'interface automatisé côté mobile.
- Aucun test de charge : l'exigence « 50 utilisateurs simultanés » du cahier
  des charges n'a pas été mesurée.
- Le mode Stripe réel n'est testé que manuellement.
- Les notifications distantes ne sont pas testables dans Expo Go : seul le
  canal local est vérifiable sans *development build*.
- Rien ne garantit automatiquement que les libellés de notification du serveur
  et de l'application restent identiques.
