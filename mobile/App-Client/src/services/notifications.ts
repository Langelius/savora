// Notifications côté application.
//
// Deux canaux, pour la même raison que le double mode de paiement : la
// démonstration doit rester possible dans Expo Go.
//
//   1. Push distantes — le serveur les envoie via le service Expo Push.
//      Elles arrivent même application fermée, mais depuis le SDK 53 elles
//      ne fonctionnent plus dans Expo Go sur Android : il faut un
//      development build.
//   2. Notification locale — déclenchée par l'application elle-même à la
//      réception d'un événement Socket.IO. Fonctionne partout, y compris
//      dans Expo Go, mais seulement application ouverte.
//
// L'enregistrement du jeton échoue silencieusement dans Expo Go : c'est
// attendu, et l'application continue de fonctionner avec le canal local.

import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";

import { api } from "./api";

// Affiche la notification même lorsque l'application est au premier plan.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let jetonCourant: string | null = null;

// Android exige un canal déclaré, sinon aucune notification ne s'affiche.
async function preparerCanalAndroid() {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync("commandes", {
    name: "Suivi des commandes",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#E96B2C",
  });
}

// Demande l'autorisation, récupère le jeton Expo et l'envoie au serveur.
// Renvoie null si ce n'est pas possible — ce n'est pas une erreur.
export async function activerNotifications(token: string): Promise<string | null> {
  try {
    await preparerCanalAndroid();

    // Un simulateur ne peut pas recevoir de notification distante.
    if (!Device.isDevice) return null;

    const existantes = await Notifications.getPermissionsAsync();
    let statut = existantes.status;

    if (statut !== "granted") {
      const demande = await Notifications.requestPermissionsAsync();
      statut = demande.status;
    }

    // L'utilisateur a refusé : on n'insiste pas, le suivi temps réel
    // à l'écran reste disponible.
    if (statut !== "granted") return null;

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    const resultat = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );

    jetonCourant = resultat.data;
    await api.enregistrerAppareil(token, jetonCourant, Platform.OS);

    return jetonCourant;
  } catch (erreur) {
    // Cas attendu dans Expo Go depuis le SDK 53 sur Android. On journalise
    // sans alerter l'utilisateur : les notifications locales prennent le relais.
    console.log(
      "Notifications distantes indisponibles :",
      erreur instanceof Error ? erreur.message : erreur
    );
    return null;
  }
}

// Retire l'appareil à la déconnexion, pour qu'il ne reçoive plus les
// notifications d'un compte auquel il n'est plus connecté.
export async function desactiverNotifications(token: string) {
  if (!jetonCourant) return;

  try {
    await api.oublierAppareil(token, jetonCourant);
  } catch {
    // Sans conséquence : le serveur nettoiera le jeton au premier échec d'envoi.
  } finally {
    jetonCourant = null;
  }
}

// Affiche immédiatement une notification locale.
// Utilisée par l'écran de suivi à la réception d'un événement Socket.IO.
export async function notifierLocalement(titre: string, corps: string) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title: titre, body: corps, sound: true },
      trigger: null, // immédiat
    });
  } catch {
    // L'affichage d'une notification ne doit jamais interrompre l'écran.
  }
}

// Libellés du suivi, alignés sur ceux du serveur (services/notifications.js).
const LIBELLES: Record<string, { titre: string; corps: string }> = {
  "confirmée": { titre: "Commande confirmée", corps: "Le restaurant a accepté ta commande." },
  "en préparation": { titre: "En préparation", corps: "Ton repas est en cours de préparation." },
  "prête": { titre: "Commande prête", corps: "Ton repas attend un livreur." },
  "prise en charge": { titre: "Livreur assigné", corps: "Un livreur récupère ta commande." },
  "en route": { titre: "En route", corps: "Ton livreur arrive avec ton repas." },
  "livrée": { titre: "Bon appétit", corps: "Ta commande est livrée. Pense à noter le restaurant." },
  "annulée": { titre: "Commande annulée", corps: "Ta commande a été annulée." },
};

export function libelleStatut(statut: string) {
  return LIBELLES[statut] ?? null;
}
