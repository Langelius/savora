// Persistance du jeton de session.
//
// Le jeton ne vivait qu'en mémoire React : fermer l'application déconnectait
// l'utilisateur. Il est désormais conservé dans le trousseau sécurisé du
// système (Keychain sur iOS, Keystore sur Android), et non dans un simple
// stockage clé-valeur en clair.
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const CLE_JETON = "savora.jeton";

// expo-secure-store n'existe pas sur le web : on y retombe sur localStorage,
// suffisant pour la démonstration en navigateur.
const surWeb = Platform.OS === "web";

export async function lireJeton(): Promise<string | null> {
  try {
    if (surWeb) return globalThis.localStorage?.getItem(CLE_JETON) ?? null;
    return await SecureStore.getItemAsync(CLE_JETON);
  } catch {
    return null;
  }
}

export async function ecrireJeton(jeton: string): Promise<void> {
  try {
    if (surWeb) globalThis.localStorage?.setItem(CLE_JETON, jeton);
    else await SecureStore.setItemAsync(CLE_JETON, jeton);
  } catch {
    // Un échec d'écriture ne doit pas empêcher d'utiliser l'application :
    // la session reste simplement valable jusqu'à la fermeture.
  }
}

export async function effacerJeton(): Promise<void> {
  try {
    if (surWeb) globalThis.localStorage?.removeItem(CLE_JETON);
    else await SecureStore.deleteItemAsync(CLE_JETON);
  } catch {
    // Rien à faire : la déconnexion locale a déjà eu lieu.
  }
}
