// Point unique de configuration réseau de l'application.
//
// Les adresses étaient auparavant écrites en dur (192.168.2.15) dans trois
// fichiers différents, ce qui cassait l'application à chaque changement de
// réseau. Tout passe désormais par le fichier .env d'Expo.
//
//   EXPO_PUBLIC_API_URL=http://192.168.x.y:3000/api
//   EXPO_PUBLIC_SOCKET_URL=http://192.168.x.y:3000
//
// Après modification du .env : relancer avec `npx expo start --clear`.

const API_PAR_DEFAUT = "http://localhost:3000/api";

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? API_PAR_DEFAUT;

// L'URL Socket.IO se déduit de celle de l'API : une seule variable suffit
// dans la majorité des cas.
export const SOCKET_URL =
  process.env.EXPO_PUBLIC_SOCKET_URL ?? API_URL.replace(/\/api\/?$/, "");

// Valeur de repli si l'API n'est pas joignable au démarrage.
// La source de vérité reste GET /api/configuration côté serveur.
export const TAUX_TAXES_PAR_DEFAUT = 0.14975;
