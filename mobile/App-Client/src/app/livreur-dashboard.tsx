import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { io, Socket } from "socket.io-client";

import { api, Commande } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { palette } from "../constants/design";

const SOCKET_URL =
  process.env.EXPO_PUBLIC_SOCKET_URL ??
  (
    process.env.EXPO_PUBLIC_API_URL ??
    "http://localhost:3000/api"
  ).replace(/\/api\/?$/, "");

const PROCHAIN_STATUT: Record<string, string | undefined> = {
  "prise en charge": "en route",
  "en route": "livrée",
};

const formatPrix = (valeur: number) =>
  `${valeur.toFixed(2).replace(".", ",")} $`;

function remplacerOuAjouter(
  liste: Commande[],
  commande: Commande
): Commande[] {
  const sansCommande = liste.filter(
    (item) => item._id !== commande._id
  );

  return [commande, ...sansCommande];
}

export default function LivreurDashboard() {
  const router = useRouter();

  const {
    token,
    utilisateur,
    deconnexion,
  } = useAuth();

  const [disponibles, setDisponibles] = useState<Commande[]>([]);
  const [mesLivraisons, setMesLivraisons] = useState<Commande[]>([]);
  const [chargement, setChargement] = useState(true);
  const [actualisation, setActualisation] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const charger = useCallback(async () => {
    if (!token) {
      setChargement(false);
      setActualisation(false);
      return;
    }

    try {
      const [disponiblesResultat, mesResultat] =
        await Promise.all([
          api.commandesDisponibles(token),
          api.commandes(token),
        ]);

      setDisponibles(disponiblesResultat.commandes ?? []);
      setMesLivraisons(mesResultat.commandes ?? []);
    } catch (erreur) {
      Alert.alert(
        "Chargement impossible",
        erreur instanceof Error
          ? erreur.message
          : "Erreur inconnue"
      );
    } finally {
      setChargement(false);
      setActualisation(false);
    }
  }, [token]);

  useEffect(() => {
    charger();
  }, [charger]);

  useEffect(() => {
    if (!token) return;

    const socket: Socket = io(SOCKET_URL, {
      auth: {
        token,
      },
      transports: ["websocket", "polling"],
    });

    const actualiser = (commande: Commande) => {
      const livreurId =
        typeof commande.livreurId === "object"
          ? commande.livreurId?._id
          : commande.livreurId;

      if (
        commande.statut === "prête" &&
        !livreurId
      ) {
        setDisponibles((liste) =>
          remplacerOuAjouter(liste, commande)
        );
      } else {
        setDisponibles((liste) =>
          liste.filter(
            (item) => item._id !== commande._id
          )
        );
      }

      if (livreurId === utilisateur?.id) {
        setMesLivraisons((liste) =>
          remplacerOuAjouter(liste, commande)
        );
      }
    };

    socket.on("commande:disponible", actualiser);
    socket.on("commande:attribuee", actualiser);
    socket.on("commande:mise-a-jour", actualiser);

    socket.on("connect_error", (erreur) => {
      console.log(
        "Erreur Socket.IO :",
        erreur.message
      );
    });

    return () => {
      socket.off("commande:disponible", actualiser);
      socket.off("commande:attribuee", actualiser);
      socket.off("commande:mise-a-jour", actualiser);
      socket.disconnect();
    };
  }, [token, utilisateur?.id]);

  const accepter = async (commande: Commande) => {
    if (!token) return;

    try {
      setActionId(commande._id);

      const resultat =
        await api.accepterLivraison(
          token,
          commande._id
        );

      setDisponibles((liste) =>
        liste.filter(
          (item) => item._id !== commande._id
        )
      );

      setMesLivraisons((liste) =>
        remplacerOuAjouter(
          liste,
          resultat.commande
        )
      );

      Alert.alert(
        "Livraison acceptée",
        "Rends-toi au restaurant pour récupérer la commande."
      );
    } catch (erreur) {
      Alert.alert(
        "Livraison indisponible",
        erreur instanceof Error
          ? erreur.message
          : "Erreur inconnue"
      );

      charger();
    } finally {
      setActionId(null);
    }
  };

  const avancer = async (commande: Commande) => {
    const prochain =
      PROCHAIN_STATUT[commande.statut];

    if (!token || !prochain) return;

    try {
      setActionId(commande._id);

      const resultat =
        await api.modifierStatutCommande(
          token,
          commande._id,
          prochain
        );

      setMesLivraisons((liste) =>
        remplacerOuAjouter(
          liste,
          resultat.commande
        )
      );
    } catch (erreur) {
      Alert.alert(
        "Mise à jour impossible",
        erreur instanceof Error
          ? erreur.message
          : "Erreur inconnue"
      );
    } finally {
      setActionId(null);
    }
  };

  const actives = useMemo(
    () =>
      mesLivraisons.filter(
        (commande) =>
          !["livrée", "annulée"].includes(
            commande.statut
          )
      ),
    [mesLivraisons]
  );

  const terminees = useMemo(
    () =>
      mesLivraisons.filter(
        (commande) =>
          commande.statut === "livrée"
      ),
    [mesLivraisons]
  );

  const commandesAffichees = useMemo(() => {
    const toutesLesCommandes = [
      ...actives,
      ...disponibles,
      ...terminees,
    ];

    return Array.from(
      new Map(
        toutesLesCommandes.map(
          (commande) => [
            commande._id,
            commande,
          ]
        )
      ).values()
    );
  }, [actives, disponibles, terminees]);

  const quitter = () => {
    deconnexion();
    router.replace("/login");
  };

  const ouvrirCarte = (commande: Commande) => {
    const nomRestaurant =
      typeof commande.restaurantId === "object"
        ? commande.restaurantId?.nom ??
          "Restaurant"
        : "Restaurant";

    router.push({
      pathname: "/carte-livraison",
      params: {
        restaurant: nomRestaurant,
        adresse:
          commande.adresseLivraison ??
          "Adresse du client",
        commandeId: commande._id,
      },
    });
  };

  if (chargement) {
    return (
      <SafeAreaView style={styles.centre}>
        <ActivityIndicator size="large" />
        <Text style={styles.doux}>
          Chargement des livraisons…
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.entete}>
        <View>
          <Text style={styles.surtitre}>
            ESPACE LIVREUR
          </Text>

          <Text style={styles.titre}>
            Mes livraisons
          </Text>

          <Text style={styles.doux}>
            {utilisateur?.nom ??
              "Livreur"}
          </Text>
        </View>

        <Pressable
          onPress={quitter}
          style={styles.deconnexion}
        >
          <Text
            style={styles.deconnexionTexte}
          >
            Déconnexion
          </Text>
        </Pressable>
      </View>

      <View style={styles.resume}>
        <View>
          <Text style={styles.nombre}>
            {disponibles.length}
          </Text>

          <Text style={styles.resumeTexte}>
            disponibles
          </Text>
        </View>

        <View>
          <Text style={styles.nombre}>
            {actives.length}
          </Text>

          <Text style={styles.resumeTexte}>
            en cours
          </Text>
        </View>

        <View>
          <Text style={styles.nombre}>
            {terminees.length}
          </Text>

          <Text style={styles.resumeTexte}>
            terminées
          </Text>
        </View>
      </View>

      <FlatList
        data={commandesAffichees}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.liste}
        refreshControl={
          <RefreshControl
            refreshing={actualisation}
            onRefresh={() => {
              setActualisation(true);
              charger();
            }}
          />
        }
        ListHeaderComponent={
          <Text style={styles.section}>
            Commandes et missions
          </Text>
        }
        ListEmptyComponent={
          <View style={styles.vide}>
            <Text style={styles.videTitre}>
              Aucune livraison
            </Text>

            <Text style={styles.doux}>
              Une commande prête apparaîtra ici
              automatiquement.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const estDisponible =
            item.statut === "prête" &&
            !item.livreurId;

          const prochain =
            PROCHAIN_STATUT[item.statut];

          const enCours =
            actionId === item._id;

          const nomRestaurant =
            typeof item.restaurantId ===
            "object"
              ? item.restaurantId?.nom ??
                "Restaurant"
              : "Restaurant";

          return (
            <View style={styles.carte}>
              <View style={styles.ligne}>
                <Text style={styles.numero}>
                  #
                  {item._id
                    .slice(-6)
                    .toUpperCase()}
                </Text>

                <View style={styles.badge}>
                  <Text
                    style={styles.badgeTexte}
                  >
                    {estDisponible
                      ? "disponible"
                      : item.statut}
                  </Text>
                </View>
              </View>

              <Text
                style={styles.restaurant}
              >
                {nomRestaurant}
              </Text>

              <Text style={styles.label}>
                À livrer chez
              </Text>

              <Text style={styles.adresse}>
                {item.adresseLivraison}
              </Text>

              <Pressable
                onPress={() =>
                  ouvrirCarte(item)
                }
                style={styles.boutonCarte}
              >
                <Text
                  style={
                    styles.boutonCarteTexte
                  }
                >
                  Voir la carte
                </Text>
              </Pressable>

              <View
                style={styles.separateur}
              />

              <View style={styles.ligne}>
                <Text style={styles.doux}>
                  {item.plats.reduce(
                    (nombre, plat) =>
                      nombre +
                      plat.quantite,
                    0
                  )}{" "}
                  article(s)
                </Text>

                <Text style={styles.total}>
                  {formatPrix(item.total)}
                </Text>
              </View>

              {estDisponible && (
                <Pressable
                  disabled={enCours}
                  onPress={() =>
                    accepter(item)
                  }
                  style={[
                    styles.action,
                    enCours &&
                      styles.inactive,
                  ]}
                >
                  <Text
                    style={
                      styles.actionTexte
                    }
                  >
                    {enCours
                      ? "Attribution…"
                      : "Accepter la livraison"}
                  </Text>
                </Pressable>
              )}

              {!estDisponible &&
                prochain && (
                  <Pressable
                    disabled={enCours}
                    onPress={() =>
                      avancer(item)
                    }
                    style={[
                      styles.action,
                      enCours &&
                        styles.inactive,
                    ]}
                  >
                    <Text
                      style={
                        styles.actionTexte
                      }
                    >
                      {enCours
                        ? "Mise à jour…"
                        : prochain ===
                          "en route"
                        ? "Commande récupérée — partir"
                        : "Confirmer la livraison"}
                    </Text>
                  </Pressable>
                )}
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: palette.fond,
  },

  centre: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: palette.fond,
  },

  doux: {
    color: palette.texteDoux,
    marginTop: 4,
  },

  entete: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  surtitre: {
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: "900",
    color: palette.orangeFonce,
  },

  titre: {
    fontSize: 28,
    fontWeight: "900",
    color: palette.texte,
    marginTop: 4,
  },

  deconnexion: {
    borderWidth: 1,
    borderColor: palette.bordure,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },

  deconnexionTexte: {
    fontWeight: "800",
    color: palette.texte,
  },

  resume: {
    marginHorizontal: 20,
    backgroundColor: palette.blanc,
    borderRadius: 20,
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: palette.bordure,
  },

  nombre: {
    fontSize: 24,
    fontWeight: "900",
    color: palette.texte,
  },

  resumeTexte: {
    color: palette.texteDoux,
    fontSize: 12,
    marginTop: 2,
  },

  liste: {
    padding: 20,
    paddingBottom: 40,
  },

  section: {
    fontSize: 18,
    fontWeight: "900",
    color: palette.texte,
    marginBottom: 12,
  },

  carte: {
    backgroundColor: palette.blanc,
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: palette.bordure,
  },

  ligne: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  numero: {
    fontWeight: "900",
    color: palette.texte,
  },

  badge: {
    backgroundColor: "#FFF0E4",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },

  badgeTexte: {
    color: palette.orangeFonce,
    fontWeight: "800",
    fontSize: 12,
  },

  restaurant: {
    fontSize: 20,
    fontWeight: "900",
    color: palette.texte,
    marginTop: 14,
  },

  label: {
    color: palette.texteDoux,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 12,
  },

  adresse: {
    color: palette.texte,
    fontSize: 15,
    marginTop: 3,
  },

  boutonCarte: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: palette.orange,
    borderRadius: 15,
    paddingVertical: 12,
    alignItems: "center",
  },

  boutonCarteTexte: {
    color: palette.orangeFonce,
    fontWeight: "900",
  },

  separateur: {
    height: 1,
    backgroundColor: palette.bordure,
    marginVertical: 14,
  },

  total: {
    fontSize: 18,
    fontWeight: "900",
    color: palette.texte,
  },

  action: {
    backgroundColor: palette.orange,
    borderRadius: 15,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 16,
  },

  inactive: {
    opacity: 0.55,
  },

  actionTexte: {
    color: palette.blanc,
    fontWeight: "900",
  },

  vide: {
    alignItems: "center",
    paddingVertical: 70,
  },

  videTitre: {
    fontSize: 22,
    fontWeight: "900",
    color: palette.texte,
    marginBottom: 8,
  },
});