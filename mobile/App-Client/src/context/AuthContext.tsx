import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { api, Utilisateur } from "../services/api";
import { ecrireJeton, effacerJeton, lireJeton } from "../services/stockage";
import { activerNotifications, desactiverNotifications } from "../services/notifications";

type AuthValeur = {
  token: string | null;
  utilisateur: Utilisateur | null;
  // false tant que la session enregistrée n'a pas été relue : évite
  // d'afficher l'écran de connexion à un utilisateur déjà connecté.
  pret: boolean;
  connexion: (courriel: string, motDePasse: string) => Promise<Utilisateur>;
  inscription: (nom: string, courriel: string, motDePasse: string) => Promise<Utilisateur>;
  deconnexion: () => Promise<void>;
};

const AuthContext = createContext<AuthValeur | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(null);
  const [pret, setPret] = useState(false);

  // Restauration de la session au démarrage de l'application.
  useEffect(() => {
    let actif = true;

    const restaurer = async () => {
      const jetonEnregistre = await lireJeton();

      if (!jetonEnregistre) {
        if (actif) setPret(true);
        return;
      }

      try {
        // Le profil est redemandé au serveur : cela valide le jeton et
        // récupère le rôle à jour, plutôt que de faire confiance au cache.
        const resultat = await api.profil(jetonEnregistre);
        if (!actif) return;
        setToken(jetonEnregistre);
        setUtilisateur(resultat.utilisateur);
        // Le jeton d'appareil est réenregistré à chaque session : il peut
        // avoir changé depuis la dernière ouverture.
        activerNotifications(jetonEnregistre);
      } catch {
        // Jeton expiré, révoqué, ou serveur injoignable : on repart propre.
        await effacerJeton();
      } finally {
        if (actif) setPret(true);
      }
    };

    restaurer();
    return () => {
      actif = false;
    };
  }, []);

  const appliquerSession = useCallback(
    async (jeton: string, profil: Utilisateur) => {
      setToken(jeton);
      setUtilisateur(profil);
      await ecrireJeton(jeton);
      // Sans await : une autorisation refusée ne doit pas retarder l'entrée
      // dans l'application.
      activerNotifications(jeton);
      return profil;
    },
    []
  );

  const connexion = useCallback(
    async (courriel: string, motDePasse: string) => {
      const resultat = await api.connexion({ courriel, motDePasse });
      return appliquerSession(resultat.token, resultat.utilisateur);
    },
    [appliquerSession]
  );

  const inscription = useCallback(
    async (nom: string, courriel: string, motDePasse: string) => {
      const resultat = await api.inscription({ nom, courriel, motDePasse });
      return appliquerSession(resultat.token, resultat.utilisateur);
    },
    [appliquerSession]
  );

  const deconnexion = useCallback(async () => {
    if (token) await desactiverNotifications(token);
    setToken(null);
    setUtilisateur(null);
    await effacerJeton();
  }, [token]);

  const valeur = useMemo(
    () => ({ token, utilisateur, pret, connexion, inscription, deconnexion }),
    [token, utilisateur, pret, connexion, inscription, deconnexion]
  );

  return <AuthContext.Provider value={valeur}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const contexte = useContext(AuthContext);
  if (!contexte) throw new Error("useAuth doit être utilisé dans AuthProvider");
  return contexte;
}
