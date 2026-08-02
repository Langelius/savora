# ADR 0006 — Notifications : push distantes avec repli local

- **Statut** : accepté
- **Date** : 2026-08-02

## Contexte

Le cahier des charges prévoyait les notifications poussées en perspective
d'amélioration. Elles ont été demandées en fin de projet pour que le client
soit prévenu à chaque étape de sa commande, sans garder l'écran de suivi ouvert.

Une contrainte est apparue immédiatement, et elle est structurante :

> Depuis le SDK 53, **Expo Go ne reçoit plus les notifications distantes sur
> Android**. Ce support avait été déprécié au SDK 52 puis retiré. Un
> *development build* est désormais nécessaire.

Le projet est en SDK 54, et toutes les démonstrations se font dans Expo Go.
Implémenter uniquement les push distantes revenait donc à livrer une
fonctionnalité invisible le jour de la présentation.

C'est exactement le mur rencontré avec le SDK Stripe (voir [ADR 0004](./0004-paiement-stripe-ou-simulation.md)),
et la même famille de solution s'applique.

## Décision

Deux canaux complémentaires, envoyés systématiquement par le serveur :

| Canal | Mécanisme | Portée | Limite |
|-------|-----------|--------|--------|
| Push distantes | Le serveur appelle le service Expo Push | Atteint l'appareil même application fermée | Nécessite un *development build* sur Android |
| Notification locale | L'application l'affiche à la réception d'un événement Socket.IO | Fonctionne partout, Expo Go compris | Uniquement application ouverte |

Le serveur envoie toujours le canal 1 s'il connaît un jeton d'appareil, et émet
toujours l'événement Socket.IO qui alimente le canal 2. L'application décide de
ce qu'elle affiche.

Les deux ne peuvent pas faire doublon : dans Expo Go, aucune push distante
n'arrive jamais ; dans un *development build*, la notification locale n'est
déclenchée que si l'écran de suivi est ouvert, cas où la push distante ne
s'affiche pas en bannière.

### Choix de conception associés

- **Les erreurs d'envoi sont absorbées et journalisées.** Une notification
  perdue est moins grave qu'un changement de statut qui échouerait à cause
  d'elle. L'appel n'est jamais attendu par le flux métier.
- **La clé unique est le jeton d'appareil**, pas le couple utilisateur/appareil.
  Un téléphone repris par un autre compte est réattribué au lieu de créer un
  doublon — sans quoi l'ancien propriétaire continuerait de recevoir les
  commandes du nouveau.
- **Les jetons signalés `DeviceNotRegistered` par Expo sont supprimés**
  automatiquement, pour ne pas accumuler d'appareils désinstallés.
- **Le jeton est retiré à la déconnexion**, pour qu'un téléphone partagé ne
  reçoive pas les commandes du compte précédent.
- **Le statut initial « en attente » ne déclenche aucune notification** : le
  client vient de passer commande, il n'a pas besoin qu'on l'en informe.

## Conséquences

**Positives**

- Le suivi est démontrable dans Expo Go, sans compte EAS ni compilation.
- Le code des vraies push est écrit, testé et fonctionnel : un simple
  *development build* suffit à les activer, sans modification du serveur.
- Le serveur reste la seule source des libellés de statut ; l'application les
  reproduit à l'identique pour le canal local.

**Négatives**

- Deux chemins à maintenir, et des libellés dupliqués entre
  `services/notifications.js` (serveur) et `services/notifications.ts` (mobile).
  Un test unitaire vérifie que chaque statut visible par le client produit bien
  un message côté serveur, mais rien ne garantit automatiquement que les deux
  listes restent identiques.
- Le canal local ne fonctionne que si l'écran de suivi est ouvert : ce n'est
  pas une vraie notification en arrière-plan.
- La démonstration présente une fonctionnalité dont le comportement diffère de
  la production. Le fait doit être énoncé pendant la présentation plutôt que
  laissé sous silence.

## Alternatives écartées

- **Push distantes uniquement** : conforme à l'intention, mais invisible le
  jour de la présentation. Aurait exigé un *development build* à compiler et à
  installer sur chaque appareil de démonstration.
- **Notifications locales uniquement** : simple, mais ne mérite pas le nom de
  notification poussée — rien n'arrive application fermée, ce qui est
  précisément l'intérêt de la fonctionnalité.
- **Service tiers (Firebase Cloud Messaging direct)** : contourne Expo Push,
  mais impose une configuration native complète, hors de portée du temps
  restant et incompatible avec Expo Go de toute façon.

## Sources

- [Push notifications troubleshooting and FAQ — Expo](https://docs.expo.dev/push-notifications/faq/)
- [Expo SDK 53 — changelog](https://expo.dev/changelog/sdk-53)
