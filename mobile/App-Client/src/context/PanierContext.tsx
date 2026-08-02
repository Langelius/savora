import { createContext, ReactNode, useContext, useMemo, useState } from "react";
import { Plat, Restaurant } from "../services/api";

type Ligne = { plat: Plat; quantite: number };
type PanierValeur = {
  lignes: Ligne[]; restaurant: Restaurant | null; quantiteTotale: number; sousTotal: number;
  ajouter: (plat: Plat, restaurant: Restaurant) => void; diminuer: (id: string) => void; retirer: (id: string) => void; vider: () => void;
};
const PanierContext = createContext<PanierValeur | null>(null);
export function PanierProvider({ children }: { children: ReactNode }) {
  const [lignes, setLignes] = useState<Ligne[]>([]);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const ajouter = (plat: Plat, resto: Restaurant) => {
    if (restaurant && restaurant._id !== resto._id) setLignes([{ plat, quantite: 1 }]);
    else setLignes(c => c.some(x => x.plat._id === plat._id) ? c.map(x => x.plat._id === plat._id ? { ...x, quantite: x.quantite + 1 } : x) : [...c, { plat, quantite: 1 }]);
    setRestaurant(resto);
  };
  const diminuer = (id: string) => setLignes(c => c.map(x => x.plat._id === id ? { ...x, quantite: x.quantite - 1 } : x).filter(x => x.quantite > 0));
  const retirer = (id: string) => setLignes(c => c.filter(x => x.plat._id !== id));
  const vider = () => { setLignes([]); setRestaurant(null); };
  const valeur = useMemo(() => ({ lignes, restaurant, ajouter, diminuer, retirer, vider, quantiteTotale: lignes.reduce((t,x)=>t+x.quantite,0), sousTotal: lignes.reduce((t,x)=>t+x.plat.prix*x.quantite,0) }), [lignes, restaurant]);
  return <PanierContext.Provider value={valeur}>{children}</PanierContext.Provider>;
}
export function usePanier(){const c=useContext(PanierContext);if(!c)throw new Error("usePanier doit être utilisé dans PanierProvider");return c;}
