# ADR 0004 — Paiement : Stripe en mode test avec repli sur simulation

- **Statut** : accepté
- **Date** : 2026-08-02

## Contexte

Le cahier des charges impose un paiement intégré via Stripe en mode test.
Trois contraintes se sont ajoutées en cours de développement :

1. Le SDK mobile `@stripe/stripe-react-native` nécessite une compilation
   native : il ne fonctionne pas dans **Expo Go**, l'outil utilisé pour les
   démonstrations sur téléphone.
2. Les séances de développement et la présentation finale peuvent se dérouler
   sans connexion Internet fiable. Une démonstration qui échoue parce que
   l'API Stripe est injoignable est un risque inacceptable pour une évaluation.
3. Toute manipulation d'un vrai numéro de carte par notre serveur nous ferait
   entrer dans le champ des exigences PCI-DSS, hors de portée d'un projet
   étudiant.

## Décision

Un service unique, `backend/src/services/paiement.js`, expose deux modes
choisis automatiquement selon la configuration :

| Condition | Mode | Comportement |
|-----------|------|--------------|
| `STRIPE_SECRET_KEY` renseignée (`sk_test_...`) | `stripe` | Le serveur crée et confirme un **PaymentIntent** en mode test |
| Aucune clé | `simulation` | Validation du format de la carte, référence factice `SIM-...` |

Le mode actif est exposé par `GET /api/configuration` : l'application mobile
adapte son message sans que le code du client ait à connaître la configuration
du serveur.

En mode `stripe`, le numéro saisi par l'utilisateur **n'est jamais transmis à
Stripe**. Il sert uniquement à sélectionner un moyen de paiement de test
(`pm_card_visa`, `pm_card_mastercard`, `pm_card_visa_chargeDeclined`). Le
serveur ne manipule donc aucune donnée de carte réelle.

Le démarrage échoue volontairement si la clé fournie est une clé **live**
(`sk_live_...`) : impossible de facturer quelqu'un par accident.

## Conséquences

**Positives**

- Le parcours de paiement est démontrable en toutes circonstances, avec ou sans
  réseau.
- L'intégration Stripe est réelle et vérifiable dans le tableau de bord Stripe
  en mode test, ce que demandait le cahier des charges.
- Aucun numéro de carte n'est stocké ni transmis : seule la référence de
  transaction est conservée sur la commande.
- La carte `4000 0000 0000 0002` permet de démontrer un **refus** de paiement,
  et donc le chemin d'erreur.

**Négatives**

- Le parcours n'est pas celui d'une application de production, où le client
  saisirait sa carte dans un composant Stripe certifié.
- Deux chemins de code à maintenir et à tester.
- La simulation pourrait donner l'illusion d'un paiement réel : les écrans
  affichent explicitement le mode utilisé.

## Alternatives écartées

- **Stripe uniquement** : rend la démonstration dépendante du réseau et
  impose de quitter Expo Go.
- **Simulation uniquement** : ne répond pas à la fonctionnalité 3 du cahier
  des charges.
