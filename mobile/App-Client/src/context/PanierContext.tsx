import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";

import { OptionPlat, Plat, Restaurant } from "../services/api";

export type LignePanier = {
  // Clé de ligne : un même plat avec deux personnalisations différentes
  // constitue deux lignes distinctes.
  cle: string;
  plat: Plat;
  options: string[];
  prixUnitaire: number;
  quantite: number;
};

type PanierValeur = {
  lignes: LignePanier[];
  restaurant: Restaurant | null;
  quantiteTotale: number;
  sousTotal: number;
  ajouter: (plat: Plat, restaurant: Restaurant, options?: string[]) => void;
  diminuer: (cle: string) => void;
  retirer: (cle: string) => void;
  vider: () => void;
};

const PanierContext = createContext<PanierValeur | null>(null);

// Prix d'une ligne = prix de base + suppléments choisis.
// Le serveur refait ce calcul de son côté : l'affichage n'est qu'une estimation.
function calculerPrixUnitaire(plat: Plat, options: string[]): number {
  let prix = plat.prix;

  const disponibles: OptionPlat[] = plat.options ?? [];
  for (const nomOption of options) {
    for (const option of disponibles) {
      if (option.nom === nomOption) {
        prix += option.prix;
        break;
      }
    }
  }

  return Math.round(prix * 100) / 100;
}

function construireCle(plat: Plat, options: string[]): string {
  return `${plat._id}::${[...options].sort().join("|")}`;
}

export function PanierProvider({ children }: { children: ReactNode }) {
  const [lignes, setLignes] = useState<LignePanier[]>([]);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);

  const ajouter = useCallback(
    (plat: Plat, resto: Restaurant, options: string[] = []) => {
      const cle = construireCle(plat, options);
      const nouvelleLigne: LignePanier = {
        cle,
        plat,
        options,
        prixUnitaire: calculerPrixUnitaire(plat, options),
        quantite: 1,
      };

      setLignes((actuelles) => {
        // Une commande ne peut concerner qu'un seul restaurant : changer de
        // restaurant repart d'un panier vide.
        if (restaurant && restaurant._id !== resto._id) return [nouvelleLigne];

        const existante = actuelles.find((ligne) => ligne.cle === cle);
        if (!existante) return [...actuelles, nouvelleLigne];

        return actuelles.map((ligne) =>
          ligne.cle === cle ? { ...ligne, quantite: ligne.quantite + 1 } : ligne
        );
      });

      setRestaurant(resto);
    },
    [restaurant]
  );

  const diminuer = useCallback((cle: string) => {
    setLignes((actuelles) =>
      actuelles
        .map((ligne) => (ligne.cle === cle ? { ...ligne, quantite: ligne.quantite - 1 } : ligne))
        .filter((ligne) => ligne.quantite > 0)
    );
  }, []);

  const retirer = useCallback((cle: string) => {
    setLignes((actuelles) => actuelles.filter((ligne) => ligne.cle !== cle));
  }, []);

  const vider = useCallback(() => {
    setLignes([]);
    setRestaurant(null);
  }, []);

  const valeur = useMemo(() => {
    let quantiteTotale = 0;
    let sousTotal = 0;

    for (const ligne of lignes) {
      quantiteTotale += ligne.quantite;
      sousTotal += ligne.prixUnitaire * ligne.quantite;
    }

    return {
      lignes,
      restaurant,
      quantiteTotale,
      sousTotal: Math.round(sousTotal * 100) / 100,
      ajouter,
      diminuer,
      retirer,
      vider,
    };
  }, [lignes, restaurant, ajouter, diminuer, retirer, vider]);

  return <PanierContext.Provider value={valeur}>{children}</PanierContext.Provider>;
}

export function usePanier() {
  const contexte = useContext(PanierContext);
  if (!contexte) throw new Error("usePanier doit être utilisé dans PanierProvider");
  return contexte;
}
