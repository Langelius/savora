// Notifications côté application.
//
// Deux canaux, pour la même raison que le double mode de paiement : la
// démonstration doit rester possible dans Expo Go.
//
//   1. Push distantes — envoyées par le serveur via le service Expo Push.
//      Elles arrivent même application fermée, mais depuis le SDK 53 elles
//      ne fonctionnent plus dans Expo Go sur Android : un development build
//      est nécessaire.
//   2. Notification locale — déclenchée par l'application à la réception d'un
//      événement Socket.IO. Fonctionne partout, application ouverte.
//
// ── Pourquoi expo-notifications est chargé paresseusement ────────────────
//
// Importer ce module exécute un effet de bord (DevicePushTokenAutoRegistration)
// qui, dans Expo Go sur Android, journalise une erreur bruyante au démarrage :
//
//   « Android Push notifications functionality was removed from Expo Go
//     with the release of SDK 53 »
//
// Comme AuthContext importe ce fichier, l'erreur apparaissait au lancement de
// l'application, avant même toute tentative d'utiliser les notifications.
// Le chargement est donc différé, et complètement évité dans Expo Go.

import Constants, { ExecutionEnvironment } from "expo-constants";
import { Platform } from "react-native";

import { api } from "./api";

// Expo Go se reconnaît à son environnement d'exécution « storeClient ».
const DANS_EXPO_GO =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Les push distantes sont impossibles dans Expo Go sur Android.
const PUSH_DISTANTES_POSSIBLES = !(DANS_EXPO_GO && Platform.OS === "android");

let moduleNotifications: typeof import("expo-notifications") | null = null;
let gestionnaireInstalle = false;
let jetonCourant: string | null = null;

// Charge expo-notifications à la demande, jamais à l'import du fichier.
function chargerNotifications() {
  if (moduleNotifications) return moduleNotifications;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    moduleNotifications = require("expo-notifications");
  } catch {
    return null;
  }

  if (moduleNotifications && !gestionnaireInstalle) {
    // Affiche la notification même application au premier plan.
    moduleNotifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    gestionnaireInstalle = true;
  }

  return moduleNotifications;
}

// Android exige un canal déclaré, sinon aucune notification ne s'affiche.
async function preparerCanalAndroid() {
  if (Platform.OS !== "android") return;

  const Notifications = chargerNotifications();
  if (!Notifications) return;

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
  // Dans Expo Go sur Android, on n'essaie même pas : le canal local suffit
  // et cela évite l'erreur au démarrage.
  if (!PUSH_DISTANTES_POSSIBLES) return null;

  try {
    const Notifications = chargerNotifications();
    if (!Notifications) return null;

    await preparerCanalAndroid();

    // Un simulateur ne peut pas recevoir de notification distante.
    const Device = require("expo-device");
    if (!Device.isDevice) return null;

    const existantes = await Notifications.getPermissionsAsync();
    let statut = existantes.status;

    if (statut !== "granted") {
      const demande = await Notifications.requestPermissionsAsync();
      statut = demande.status;
    }

    // L'utilisateur a refusé : on n'insiste pas, le suivi à l'écran reste
    // disponible et les notifications locales continuent de fonctionner.
    if (statut !== "granted") return null;

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

    const resultat = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );

    jetonCourant = resultat.data;
    await api.enregistrerAppareil(token, jetonCourant, Platform.OS);

    return jetonCourant;
  } catch (erreur) {
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
// Fonctionne dans Expo Go, y compris sur Android.
export async function notifierLocalement(titre: string, corps: string) {
  try {
    const Notifications = chargerNotifications();
    if (!Notifications) return;

    await preparerCanalAndroid();

    await Notifications.scheduleNotificationAsync({
      content: { title: titre, body: corps, sound: true },
      trigger: null, // immédiat
    });
  } catch {
    // L'affichage d'une notification ne doit jamais interrompre l'écran.
  }
}

// Indique le canal réellement actif — utile pour l'afficher en démonstration.
export function modeNotifications(): "distant" | "local" {
  return PUSH_DISTANTES_POSSIBLES ? "distant" : "local";
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
