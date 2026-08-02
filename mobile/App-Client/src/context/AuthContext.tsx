import { createContext, ReactNode, useContext, useMemo, useState } from "react";
import { api, Utilisateur } from "../services/api";

type AuthValeur = {
  token: string | null;
  utilisateur: Utilisateur | null;
  connexion: (courriel: string, motDePasse: string) => Promise<Utilisateur>;
  inscription: (nom: string, courriel: string, motDePasse: string) => Promise<Utilisateur>;
  deconnexion: () => void;
};

const AuthContext = createContext<AuthValeur | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(null);

  const connexion = async (courriel: string, motDePasse: string) => {
    const resultat = await api.connexion({ courriel, motDePasse });
    setToken(resultat.token);
    setUtilisateur(resultat.utilisateur);
    return resultat.utilisateur;
  };
  const inscription = async (nom: string, courriel: string, motDePasse: string) => {
    const resultat = await api.inscription({ nom, courriel, motDePasse });
    setToken(resultat.token);
    setUtilisateur(resultat.utilisateur);
    return resultat.utilisateur;
  };
  const deconnexion = () => { setToken(null); setUtilisateur(null); };
  const valeur = useMemo(() => ({ token, utilisateur, connexion, inscription, deconnexion }), [token, utilisateur]);
  return <AuthContext.Provider value={valeur}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const contexte = useContext(AuthContext);
  if (!contexte) throw new Error("useAuth doit être utilisé dans AuthProvider");
  return contexte;
}
