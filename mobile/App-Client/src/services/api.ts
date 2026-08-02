import { API_URL } from "../constants/config";

export type Utilisateur = {
  id: string;
  nom: string;
  courriel: string;
  role: string;
  telephone?: string;
  restaurantId?: string | null;
};

export type Restaurant = {
  _id: string;
  nom: string;
  cuisine: string;
  description?: string;
  image: string;
  adresse?: string;
  note: number;
  nombreAvis?: number;
  delai: string;
  fraisLivraison: number;
  actif?: boolean;
};

export type OptionPlat = {
  nom: string;
  prix: number;
};

export type Plat = {
  _id: string;
  restaurantId: string;
  nom: string;
  description: string;
  prix: number;
  categorie: string;
  image: string;
  options?: OptionPlat[];
  populaire?: boolean;
};

export type Avis = {
  _id: string;
  commandeId: string;
  restaurantId: string;
  note: number;
  commentaire: string;
  createdAt: string;
  utilisateurId?: { _id: string; nom: string };
};

export type PlatModifiable = {
  nom?: string;
  description?: string;
  prix?: number;
  categorie?: string;
  image?: string;
  options?: OptionPlat[];
  populaire?: boolean;
  disponible?: boolean;
};

export type RestaurantModifiable = {
  nom?: string;
  cuisine?: string;
  description?: string;
  image?: string;
  adresse?: string;
  delai?: string;
  fraisLivraison?: number;
  actif?: boolean;
};

// Renvoyée par GET /api/configuration : évite de dupliquer le taux de taxes
// entre le serveur et l'application.
export type ConfigurationServeur = {
  version: string;
  tauxTaxes: number;
  devise: string;
  modePaiement: "stripe" | "simulation";
};

export type Commande = {
  _id: string;
  statut: string;
  sousTotal?: number;
  fraisLivraison?: number;
  taxes?: number;
  total: number;
  adresseLivraison: string;
  createdAt: string;
  updatedAt?: string;

  restaurantId: Restaurant;

  utilisateurId?: {
    _id: string;
    nom: string;
    courriel?: string;
    telephone?: string;
  };

  livreurId?: {
    _id: string;
    nom: string;
    courriel?: string;
    telephone?: string;
  } | null;

  plats: Array<{
    platId: string;
    nom: string;
    prix: number;
    quantite: number;
    options?: string[];
  }>;

  historiqueStatuts?: Array<{
    statut: string;
    date: string;
  }>;
  methodePaiement?: "carte" | "livraison";
  fournisseurPaiement?: "stripe" | "simulation" | "comptant";
  statutPaiement?: "en attente" | "payé" | "à payer" | "échoué" | "remboursé";
  referencePaiement?: string | null;
  avisDepose?: boolean;
};

export type MessageDiscussion = {
  _id: string;
  commandeId: string;
  texte: string;
  createdAt: string;
  auteurId: {
    _id: string;
    nom: string;
    role: string;
  };
};

export type StatistiquesAdmin = {
  utilisateurs: {
    total: number;
    clients: number;
    livreurs: number;
    administrateurs: number;
  };

  restaurants: {
    total: number;
    actifs: number;
    inactifs: number;
  };

  commandes: {
    total: number;
    enAttente: number;
    enPreparation: number;
    enRoute: number;
    livrees: number;
    annulees: number;
  };

  revenusTotaux: number;
};

export type UtilisateurAdmin = {
  _id: string;
  nom: string;
  courriel: string;
  role: "client" | "restaurant" | "livreur" | "admin";
  telephone?: string;
  createdAt?: string;

  restaurantId?: {
    _id: string;
    nom: string;
    cuisine: string;
    actif: boolean;
  } | null;
};

async function requete<T>(
  chemin: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const controleur = new AbortController();

  const timeout = setTimeout(() => {
    controleur.abort();
  }, 12000);

  try {
    const reponse = await fetch(`${API_URL}${chemin}`, {
      ...options,
      signal: controleur.signal,
      headers: {
        "Content-Type": "application/json",

        ...(token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {}),

        ...(options.headers ?? {}),
      },
    });

    const texte = await reponse.text();

    let donnees: any = {};

    try {
      donnees = texte ? JSON.parse(texte) : {};
    } catch {
      donnees = {
        message: texte || "Réponse invalide du serveur.",
      };
    }

    if (!reponse.ok) {
      throw new Error(
        donnees.message ??
          `Erreur HTTP ${reponse.status}`
      );
    }

    return donnees as T;
  } catch (erreur) {
    if (
      erreur instanceof Error &&
      erreur.name === "AbortError"
    ) {
      throw new Error(
        `Le serveur ne répond pas à ${API_URL}. Vérifie que le backend est démarré, que le téléphone et le PC sont sur le même Wi-Fi et que le port 3000 est autorisé dans le pare-feu.`
      );
    }

    if (erreur instanceof TypeError) {
      throw new Error(
        `Connexion impossible à ${API_URL}. Vérifie le Wi-Fi, le pare-feu Windows et redémarre Expo avec npx expo start --clear.`
      );
    }

    throw erreur;
  } finally {
    clearTimeout(timeout);
  }
}

export const api = {
  // Configuration publique du serveur (taux de taxes, mode de paiement).
  configuration: () => requete<ConfigurationServeur>("/configuration"),

  inscription: (corps: {
    nom: string;
    courriel: string;
    motDePasse: string;
  }) =>
    requete<{
      token: string;
      utilisateur: Utilisateur;
    }>("/auth/inscription", {
      method: "POST",
      body: JSON.stringify(corps),
    }),

  connexion: (corps: {
    courriel: string;
    motDePasse: string;
  }) =>
    requete<{
      token: string;
      utilisateur: Utilisateur;
    }>("/auth/connexion", {
      method: "POST",
      body: JSON.stringify(corps),
    }),

  profil: (token: string) =>
    requete<{
      utilisateur: Utilisateur;
    }>("/auth/profil", {}, token),

  restaurants: (recherche = "") =>
    requete<{
      restaurants: Restaurant[];
    }>(
      `/restaurants${
        recherche
          ? `?recherche=${encodeURIComponent(
              recherche
            )}`
          : ""
      }`
    ),

  restaurant: (id: string) =>
    requete<{
      restaurant: Restaurant;
      plats: Plat[];
    }>(`/restaurants/${id}`),

  creerCommande: (
    token: string,
    corps: {
      restaurantId: string;
      plats: Array<{
        platId: string;
        quantite: number;
        options?: string[];
      }>;
      adresseLivraison: string;
      methodePaiement: string;
      paiement?: {
        titulaire: string;
        numero: string;
        expiration: string;
        cvv: string;
      };
    }
  ) =>
    requete<{
      commande: Commande;
    }>(
      "/commandes",
      {
        method: "POST",
        body: JSON.stringify(corps),
      },
      token
    ),

  commandes: (token: string) =>
    requete<{
      commandes: Commande[];
    }>("/commandes", {}, token),

  commande: (token: string, id: string) =>
    requete<{
      commande: Commande;
    }>(`/commandes/${id}`, {}, token),

  commandesDisponibles: (token: string) =>
    requete<{
      commandes: Commande[];
    }>("/commandes/disponibles", {}, token),

  accepterLivraison: (
    token: string,
    id: string
  ) =>
    requete<{
      commande: Commande;
    }>(
      `/commandes/${id}/accepter`,
      {
        method: "PATCH",
      },
      token
    ),

  modifierStatutCommande: (
    token: string,
    id: string,
    statut: string
  ) =>
    requete<{
      commande: Commande;
    }>(
      `/commandes/${id}/statut`,
      {
        method: "PATCH",
        body: JSON.stringify({
          statut,
        }),
      },
      token
    ),


  messagesCommande: (token: string, id: string) =>
    requete<{ messages: MessageDiscussion[] }>(
      `/commandes/${id}/messages`,
      {},
      token
    ),

  envoyerMessageCommande: (token: string, id: string, texte: string) =>
    requete<{ message: MessageDiscussion }>(
      `/commandes/${id}/messages`,
      {
        method: "POST",
        body: JSON.stringify({ texte }),
      },
      token
    ),

  // ── Notation des restaurants ────────────────────────────────────────────
  avisRestaurant: (id: string) =>
    requete<{
      restaurant: { _id: string; nom: string; note: number; nombreAvis: number };
      avis: Avis[];
    }>(`/restaurants/${id}/avis`),

  avisCommande: (token: string, id: string) =>
    requete<{ avis: Avis | null }>(`/commandes/${id}/avis`, {}, token),

  deposerAvis: (token: string, id: string, note: number, commentaire: string) =>
    requete<{
      avis: Avis;
      restaurant: { note: number; nombreAvis: number };
    }>(
      `/commandes/${id}/avis`,
      {
        method: "POST",
        body: JSON.stringify({ note, commentaire }),
      },
      token
    ),

  // ── Notifications ───────────────────────────────────────────────────────
  enregistrerAppareil: (token: string, jeton: string, plateforme: string) =>
    requete<{ message: string }>(
      "/notifications/appareil",
      { method: "POST", body: JSON.stringify({ jeton, plateforme }) },
      token
    ),

  oublierAppareil: (token: string, jeton: string) =>
    requete<{ message: string }>(
      "/notifications/appareil",
      { method: "DELETE", body: JSON.stringify({ jeton }) },
      token
    ),

  // ── Menu géré par le restaurant ─────────────────────────────────────────
  monRestaurant: (token: string) =>
    requete<{ restaurant: Restaurant; plats: Plat[] }>("/mon-restaurant", {}, token),

  modifierMonRestaurant: (token: string, champs: RestaurantModifiable) =>
    requete<{ restaurant: Restaurant }>(
      "/mon-restaurant",
      { method: "PUT", body: JSON.stringify(champs) },
      token
    ),

  creerMonPlat: (token: string, champs: PlatModifiable) =>
    requete<{ plat: Plat }>(
      "/mon-restaurant/plats",
      { method: "POST", body: JSON.stringify(champs) },
      token
    ),

  modifierMonPlat: (token: string, platId: string, champs: PlatModifiable) =>
    requete<{ plat: Plat }>(
      `/mon-restaurant/plats/${platId}`,
      { method: "PUT", body: JSON.stringify(champs) },
      token
    ),

  retirerMonPlat: (token: string, platId: string) =>
    requete<{ message: string }>(
      `/mon-restaurant/plats/${platId}`,
      { method: "DELETE" },
      token
    ),

  // ── Restaurants et menus gérés par l'administration ─────────────────────
  creerRestaurantAdmin: (
    token: string,
    champs: RestaurantModifiable & {
      gestionnaire?: { nom?: string; courriel: string; motDePasse?: string };
    }
  ) =>
    requete<{
      restaurant: Restaurant;
      gestionnaire: { id: string; nom: string; courriel: string } | null;
    }>("/admin/restaurants", { method: "POST", body: JSON.stringify(champs) }, token),

  modifierRestaurantAdmin: (token: string, id: string, champs: RestaurantModifiable) =>
    requete<{ restaurant: Restaurant }>(
      `/admin/restaurants/${id}`,
      { method: "PUT", body: JSON.stringify(champs) },
      token
    ),

  platsRestaurantAdmin: (token: string, restaurantId: string) =>
    requete<{ restaurant: Restaurant; plats: Plat[] }>(
      `/admin/restaurants/${restaurantId}/plats`,
      {},
      token
    ),

  creerPlatAdmin: (token: string, restaurantId: string, champs: PlatModifiable) =>
    requete<{ plat: Plat }>(
      `/admin/restaurants/${restaurantId}/plats`,
      { method: "POST", body: JSON.stringify(champs) },
      token
    ),

  modifierPlatAdmin: (token: string, platId: string, champs: PlatModifiable) =>
    requete<{ plat: Plat }>(
      `/admin/plats/${platId}`,
      { method: "PUT", body: JSON.stringify(champs) },
      token
    ),

  retirerPlatAdmin: (token: string, platId: string) =>
    requete<{ message: string }>(`/admin/plats/${platId}`, { method: "DELETE" }, token),

  statistiquesAdmin: (token: string) =>
    requete<{
      statistiques: StatistiquesAdmin;
    }>("/admin/statistiques", {}, token),

  utilisateursAdmin: (
    token: string,
    role = "",
    recherche = ""
  ) => {
    const parametres: string[] = [];

    if (role) {
      parametres.push(
        `role=${encodeURIComponent(role)}`
      );
    }

    if (recherche) {
      parametres.push(
        `recherche=${encodeURIComponent(
          recherche
        )}`
      );
    }

    const chemin =
      parametres.length > 0
        ? `/admin/utilisateurs?${parametres.join(
            "&"
          )}`
        : "/admin/utilisateurs";

    return requete<{
      utilisateurs: UtilisateurAdmin[];
    }>(chemin, {}, token);
  },

  modifierRoleUtilisateurAdmin: (
    token: string,
    id: string,
    role:
      | "client"
      | "restaurant"
      | "livreur"
      | "admin"
  ) =>
    requete<{
      message: string;
      utilisateur: UtilisateurAdmin;
    }>(
      `/admin/utilisateurs/${id}/role`,
      {
        method: "PATCH",
        body: JSON.stringify({
          role,
        }),
      },
      token
    ),

  supprimerUtilisateurAdmin: (
    token: string,
    id: string
  ) =>
    requete<{
      message: string;
    }>(
      `/admin/utilisateurs/${id}`,
      {
        method: "DELETE",
      },
      token
    ),

  restaurantsAdmin: (
    token: string,
    actif?: boolean,
    recherche = ""
  ) => {
    const parametres: string[] = [];

    if (typeof actif === "boolean") {
      parametres.push(`actif=${actif}`);
    }

    if (recherche) {
      parametres.push(
        `recherche=${encodeURIComponent(
          recherche
        )}`
      );
    }

    const chemin =
      parametres.length > 0
        ? `/admin/restaurants?${parametres.join(
            "&"
          )}`
        : "/admin/restaurants";

    return requete<{
      restaurants: Restaurant[];
    }>(chemin, {}, token);
  },

  modifierEtatRestaurantAdmin: (
    token: string,
    id: string,
    actif: boolean
  ) =>
    requete<{
      message: string;
      restaurant: Restaurant;
    }>(
      `/admin/restaurants/${id}/actif`,
      {
        method: "PATCH",
        body: JSON.stringify({
          actif,
        }),
      },
      token
    ),

  supprimerRestaurantAdmin: (
    token: string,
    id: string
  ) =>
    requete<{
      message: string;
    }>(
      `/admin/restaurants/${id}`,
      {
        method: "DELETE",
      },
      token
    ),

  commandesAdmin: (
    token: string,
    statut = "",
    restaurantId = "",
    livreurId = ""
  ) => {
    const parametres: string[] = [];

    if (statut) {
      parametres.push(
        `statut=${encodeURIComponent(statut)}`
      );
    }

    if (restaurantId) {
      parametres.push(
        `restaurantId=${encodeURIComponent(
          restaurantId
        )}`
      );
    }

    if (livreurId) {
      parametres.push(
        `livreurId=${encodeURIComponent(
          livreurId
        )}`
      );
    }

    const chemin =
      parametres.length > 0
        ? `/admin/commandes?${parametres.join(
            "&"
          )}`
        : "/admin/commandes";

    return requete<{
      commandes: Commande[];
    }>(chemin, {}, token);
  },

  annulerCommandeAdmin: (
    token: string,
    id: string
  ) =>
    requete<{
      message: string;
      commande: Commande;
    }>(
      `/admin/commandes/${id}/annuler`,
      {
        method: "PATCH",
      },
      token
    ),
};