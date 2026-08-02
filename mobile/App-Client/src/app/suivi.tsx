import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { io, Socket } from "socket.io-client";

import { api, Commande } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { palette } from "../constants/design";
import { SOCKET_URL } from "../constants/config";
import { libelleStatut, notifierLocalement } from "../services/notifications";

const ETAPES = [
  "en attente",
  "confirmée",
  "en préparation",
  "prête",
  "prise en charge",
  "en route",
  "livrée",
];

const DUREE_LIVRAISON_ESTIMEE = 25;

function calculerMinutesRestantes(commande: Commande): number | null {
  if (commande.statut === "livrée") {
    return 0;
  }

  if (commande.statut !== "en route") {
    return null;
  }

  const historiqueEnRoute =
    commande.historiqueStatuts?.find(
      (historique) => historique.statut === "en route"
    );

  const dateDepart = historiqueEnRoute?.date
    ? new Date(historiqueEnRoute.date)
    : new Date(commande.updatedAt ?? commande.createdAt);

  const maintenant = new Date();

  const minutesEcoulees = Math.floor(
    (maintenant.getTime() - dateDepart.getTime()) / 60000
  );

  return Math.max(
    1,
    DUREE_LIVRAISON_ESTIMEE - minutesEcoulees
  );
}

export default function Suivi() {
  const { id } = useLocalSearchParams<{
    id?: string;
  }>();

  const router = useRouter();
  const { token } = useAuth();

  const [commande, setCommande] =
    useState<Commande | null>(null);

  const [chargement, setChargement] =
    useState(true);

  const [maintenant, setMaintenant] =
    useState(Date.now());

  useEffect(() => {
    if (!id || !token) {
      setChargement(false);
      return;
    }

    const chargerCommande = async () => {
      try {
        const resultat = await api.commande(
          token,
          id
        );

        setCommande(resultat.commande);
      } catch (erreur) {
        Alert.alert(
          "Erreur",
          erreur instanceof Error
            ? erreur.message
            : "Erreur inconnue"
        );
      } finally {
        setChargement(false);
      }
    };

    chargerCommande();

    const intervalle = setInterval(
      chargerCommande,
      10000
    );

    return () => {
      clearInterval(intervalle);
    };
  }, [id, token]);

  useEffect(() => {
    if (!id || !token) return;

    const socket: Socket = io(SOCKET_URL, {
      auth: {
        token,
      },
      transports: ["websocket", "polling"],
    });

    socket.emit("commande:rejoindre", id);

    const mettreAJour = (
      nouvelleCommande: Commande
    ) => {
      if (nouvelleCommande._id !== id) return;

      // Canal local : affiche une notification à chaque étape franchie.
      // Il double les push distantes du serveur, qui ne fonctionnent pas
      // dans Expo Go sur Android depuis le SDK 53. Les deux ne peuvent pas
      // faire doublon puisqu'Expo Go ne reçoit jamais les push distantes.
      setCommande((precedente) => {
        if (precedente && precedente.statut !== nouvelleCommande.statut) {
          const libelle = libelleStatut(nouvelleCommande.statut);
          if (libelle) notifierLocalement(libelle.titre, libelle.corps);
        }
        return nouvelleCommande;
      });
    };

    socket.on(
      "commande:mise-a-jour",
      mettreAJour
    );

    socket.on(
      "commande:attribuee",
      mettreAJour
    );

    return () => {
      socket.emit("commande:quitter", id);

      socket.off(
        "commande:mise-a-jour",
        mettreAJour
      );

      socket.off(
        "commande:attribuee",
        mettreAJour
      );

      socket.disconnect();
    };
  }, [id, token]);

  useEffect(() => {
    const intervalle = setInterval(() => {
      setMaintenant(Date.now());
    }, 60000);

    return () => {
      clearInterval(intervalle);
    };
  }, []);

  const minutesRestantes = useMemo(() => {
    if (!commande) return null;

    return calculerMinutesRestantes(
      commande
    );
  }, [commande, maintenant]);

  if (chargement) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator
          size="large"
          style={styles.chargement}
        />
      </SafeAreaView>
    );
  }

  if (!commande) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centre}>
          <Text style={styles.titre}>
            Aucune commande à suivre
          </Text>

          <Pressable
            onPress={() =>
              router.replace("/restaurants")
            }
            style={styles.bouton}
          >
            <Text style={styles.boutonTexte}>
              Voir les restaurants
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const indexEtape = Math.max(
    0,
    ETAPES.indexOf(commande.statut)
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.page}>
        <Text style={styles.logo}>
          SAVORA.
        </Text>

        <Text style={styles.titre}>
          Ta commande est{" "}
          {commande.statut}
        </Text>

        <Text style={styles.doux}>
          {commande.restaurantId?.nom ??
            "Restaurant"}{" "}
          · {commande.total.toFixed(2)} $
        </Text>

        {commande.statut === "en route" &&
          minutesRestantes !== null && (
            <View style={styles.estimation}>
              <Text
                style={
                  styles.estimationPetit
                }
              >
                ARRIVÉE APPROXIMATIVE
              </Text>

              <Text
                style={
                  styles.estimationNombre
                }
              >
                {minutesRestantes}
              </Text>

              <Text
                style={
                  styles.estimationMinutes
                }
              >
                minute
                {minutesRestantes > 1
                  ? "s"
                  : ""}
              </Text>

              <Text
                style={
                  styles.estimationInfo
                }
              >
                Ton livreur est en route
                vers ton adresse.
              </Text>
            </View>
          )}

        {commande.statut === "livrée" && (
          <View style={styles.livree}>
            <Text style={styles.livreeTitre}>
              Commande livrée
            </Text>

            <Text style={styles.doux}>
              Bon appétit !
            </Text>
          </View>
        )}

        <View style={styles.carte}>
          {ETAPES.map((etape, index) => (
            <View
              key={etape}
              style={styles.etape}
            >
              <View
                style={[
                  styles.point,
                  index <= indexEtape &&
                    styles.pointActif,
                ]}
              />

              <View>
                <Text
                  style={[
                    styles.nomEtape,
                    index <= indexEtape &&
                      styles.nomActif,
                  ]}
                >
                  {etape
                    .charAt(0)
                    .toUpperCase() +
                    etape.slice(1)}
                </Text>

                {index === indexEtape && (
                  <Text
                    style={styles.douxEtape}
                  >
                    Étape actuelle
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.adresse}>
          Livraison :{" "}
          {commande.adresseLivraison}
        </Text>

        <View style={styles.paiementInfo}>
          <Text style={styles.paiementTitre}>Paiement</Text>
          <Text style={styles.doux}>
            {commande.methodePaiement === "livraison" ? "À la livraison" : "Carte bancaire"} · {commande.statutPaiement ?? "en attente"}
          </Text>
        </View>

        {/* La notation n'apparaît qu'une fois le repas livré, et une seule
            fois par commande : c'est aussi la règle appliquée par l'API. */}
        {commande.statut === "livrée" && (
          <Pressable
            onPress={() =>
              router.push(
                `/avis?id=${commande._id}&restaurant=${encodeURIComponent(
                  commande.restaurantId?.nom ?? "Restaurant"
                )}` as never
              )
            }
            style={styles.boutonNoter}
          >
            <Text style={styles.boutonNoterTexte}>
              {commande.avisDepose ? "Voir mon avis" : "★  Noter le restaurant"}
            </Text>
          </Pressable>
        )}

        <Pressable
          onPress={() => router.push(`/discussion?id=${commande._id}` as never)}
          style={styles.boutonSecondaire}
        >
          <Text style={styles.boutonSecondaireTexte}>Ouvrir la discussion</Text>
        </Pressable>

        <Pressable
          onPress={() =>
            router.replace("/restaurants")
          }
          style={styles.bouton}
        >
          <Text style={styles.boutonTexte}>
            Retour à l’accueil
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  boutonNoter: {
    marginTop: 16,
    backgroundColor: palette.or,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
  },

  boutonNoterTexte: {
    color: palette.noir,
    fontWeight: "900",
    fontSize: 16,
  },

  safe: {
    flex: 1,
    backgroundColor: palette.fond,
  },

  page: {
    flex: 1,
    padding: 24,
  },

  centre: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  chargement: {
    marginTop: 100,
  },

  logo: {
    fontWeight: "900",
    letterSpacing: 4,
    marginTop: 15,
    marginBottom: 35,
  },

  titre: {
    fontSize: 30,
    fontWeight: "900",
    textAlign: "center",
    color: palette.texte,
  },

  doux: {
    color: palette.texteDoux,
    marginTop: 8,
    textAlign: "center",
  },

  estimation: {
    marginTop: 24,
    backgroundColor: palette.orange,
    borderRadius: 24,
    padding: 22,
    alignItems: "center",
  },

  estimationPetit: {
    color: palette.blanc,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.5,
  },

  estimationNombre: {
    color: palette.blanc,
    fontSize: 52,
    fontWeight: "900",
    marginTop: 6,
  },

  estimationMinutes: {
    color: palette.blanc,
    fontSize: 18,
    fontWeight: "900",
  },

  estimationInfo: {
    color: palette.blanc,
    marginTop: 10,
    textAlign: "center",
  },

  livree: {
    backgroundColor: palette.blanc,
    borderWidth: 1,
    borderColor: palette.bordure,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    marginTop: 24,
  },

  livreeTitre: {
    fontSize: 22,
    fontWeight: "900",
    color: palette.texte,
  },

  carte: {
    backgroundColor: palette.blanc,
    borderRadius: 22,
    padding: 22,
    marginTop: 30,
    borderWidth: 1,
    borderColor: palette.bordure,
  },

  etape: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginVertical: 12,
  },

  point: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: palette.bordure,
  },

  pointActif: {
    backgroundColor: palette.orange,
  },

  nomEtape: {
    fontSize: 17,
    color: palette.texteDoux,
  },

  nomActif: {
    fontWeight: "900",
    color: palette.texte,
  },

  douxEtape: {
    color: palette.texteDoux,
    marginTop: 3,
  },

  paiementInfo: { backgroundColor: palette.blanc, borderRadius: 16, padding: 14, marginTop: 14, borderWidth: 1, borderColor: palette.bordure },
  paiementTitre: { fontWeight: "900", marginBottom: 4 },
  boutonSecondaire: { borderWidth: 1, borderColor: palette.orange, borderRadius: 16, padding: 15, alignItems: "center", marginTop: 14 },
  boutonSecondaireTexte: { color: palette.orange, fontWeight: "900" },
  adresse: {
    marginTop: 22,
    textAlign: "center",
    lineHeight: 21,
    color: palette.texte,
  },

  bouton: {
    backgroundColor: palette.orange,
    borderRadius: 18,
    padding: 17,
    marginTop: 28,
    minWidth: 220,
  },

  boutonTexte: {
    color: palette.blanc,
    fontWeight: "900",
    textAlign: "center",
  },
});