import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";

import { api, Restaurant } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function AdminRestaurants() {
  const router = useRouter();
  const { token, utilisateur } = useAuth();

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [chargement, setChargement] = useState(true);
  const [recherche, setRecherche] = useState("");
  const [filtreActif, setFiltreActif] = useState<
    "tous" | "actifs" | "inactifs"
  >("tous");

  const chargerRestaurants = useCallback(async () => {
    if (!token) {
      setChargement(false);
      return;
    }

    try {
      setChargement(true);

      let actif: boolean | undefined;

      if (filtreActif === "actifs") {
        actif = true;
      }

      if (filtreActif === "inactifs") {
        actif = false;
      }

      const resultat = await api.restaurantsAdmin(
        token,
        actif,
        recherche
      );

      setRestaurants(resultat.restaurants);
    } catch (erreur) {
      Alert.alert(
        "Erreur",
        erreur instanceof Error
          ? erreur.message
          : "Impossible de charger les restaurants."
      );
    } finally {
      setChargement(false);
    }
  }, [token, recherche, filtreActif]);

  useEffect(() => {
    if (utilisateur?.role !== "admin") {
      router.replace("/");
      return;
    }

    chargerRestaurants();
  }, [utilisateur, chargerRestaurants, router]);

  const modifierEtat = async (
    restaurant: Restaurant
  ) => {
    if (!token) {
      return;
    }

    const nouvelEtat = !restaurant.actif;

    try {
      const resultat =
        await api.modifierEtatRestaurantAdmin(
          token,
          restaurant._id,
          nouvelEtat
        );

      setRestaurants((liste) =>
        liste.map((element) =>
          element._id === restaurant._id
            ? resultat.restaurant
            : element
        )
      );
    } catch (erreur) {
      Alert.alert(
        "Erreur",
        erreur instanceof Error
          ? erreur.message
          : "Impossible de modifier le restaurant."
      );
    }
  };

  const supprimerRestaurant = (
    restaurant: Restaurant
  ) => {
    Alert.alert(
      "Supprimer le restaurant",
      `Supprimer définitivement ${restaurant.nom} ?`,
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            if (!token) {
              return;
            }

            try {
              await api.supprimerRestaurantAdmin(
                token,
                restaurant._id
              );

              setRestaurants((liste) =>
                liste.filter(
                  (element) =>
                    element._id !== restaurant._id
                )
              );
            } catch (erreur) {
              Alert.alert(
                "Erreur",
                erreur instanceof Error
                  ? erreur.message
                  : "Impossible de supprimer le restaurant."
              );
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.page}>
        <View style={styles.entete}>
          <Pressable
            onPress={() => router.back()}
            style={styles.retour}
          >
            <Text style={styles.retourTexte}>‹</Text>
          </Pressable>

          <View>
            <Text style={styles.titre}>
              Restaurants
            </Text>

            <Text style={styles.sousTitre}>
              Gestion des restaurants Savora
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() => router.push("/admin-restaurant-nouveau" as never)}
          style={styles.boutonNouveau}
        >
          <Text style={styles.boutonNouveauTexte}>+  Nouveau restaurant</Text>
        </Pressable>

        <TextInput
          value={recherche}
          onChangeText={setRecherche}
          placeholder="Rechercher par nom ou cuisine"
          style={styles.recherche}
          onSubmitEditing={chargerRestaurants}
        />

        <View style={styles.filtres}>
          {[
            { cle: "tous", texte: "Tous" },
            { cle: "actifs", texte: "Actifs" },
            { cle: "inactifs", texte: "Inactifs" },
          ].map((filtre) => (
            <Pressable
              key={filtre.cle}
              onPress={() =>
                setFiltreActif(
                  filtre.cle as
                    | "tous"
                    | "actifs"
                    | "inactifs"
                )
              }
              style={[
                styles.filtre,
                filtreActif === filtre.cle &&
                  styles.filtreActif,
              ]}
            >
              <Text
                style={[
                  styles.filtreTexte,
                  filtreActif === filtre.cle &&
                    styles.filtreTexteActif,
                ]}
              >
                {filtre.texte}
              </Text>
            </Pressable>
          ))}
        </View>

        {chargement ? (
          <View style={styles.centre}>
            <ActivityIndicator size="large" />
          </View>
        ) : (
          <FlatList
            data={restaurants}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.liste}
            ListEmptyComponent={
              <Text style={styles.vide}>
                Aucun restaurant trouvé.
              </Text>
            }
            renderItem={({ item }) => (
              <View style={styles.carte}>
                <View style={styles.informations}>
                  <Text style={styles.nom}>
                    {item.nom}
                  </Text>

                  <Text style={styles.cuisine}>
                    {item.cuisine}
                  </Text>

                  <View
                    style={[
                      styles.badge,
                      item.actif
                        ? styles.badgeActif
                        : styles.badgeInactif,
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeTexte,
                        item.actif
                          ? styles.badgeTexteActif
                          : styles.badgeTexteInactif,
                      ]}
                    >
                      {item.actif ? "Actif" : "Inactif"}
                    </Text>
                  </View>
                </View>

                <View style={styles.actions}>
                  <Pressable
                    onPress={() =>
                      router.push(`/restaurant-menu?restaurantId=${item._id}` as never)
                    }
                    style={styles.boutonMenu}
                  >
                    <Text style={styles.boutonEtatTexte}>Menu</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => modifierEtat(item)}
                    style={[
                      styles.boutonEtat,
                      item.actif
                        ? styles.boutonDesactiver
                        : styles.boutonActiver,
                    ]}
                  >
                    <Text style={styles.boutonEtatTexte}>
                      {item.actif
                        ? "Désactiver"
                        : "Activer"}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() =>
                      supprimerRestaurant(item)
                    }
                    style={styles.boutonSupprimer}
                  >
                    <Text
                      style={styles.boutonSupprimerTexte}
                    >
                      Supprimer
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },

  page: {
    flex: 1,
    paddingHorizontal: 20,
  },

  entete: {
    marginTop: 15,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
  },

  retour: {
    width: 45,
    height: 45,
    marginRight: 12,
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },

  retourTexte: {
    color: "#F97316",
    fontSize: 34,
  },

  titre: {
    fontSize: 29,
    fontWeight: "900",
    color: "#111111",
  },

  sousTitre: {
    color: "#777777",
    marginTop: 3,
  },

  recherche: {
    height: 53,
    borderRadius: 17,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7E7E7",
    marginBottom: 14,
  },

  filtres: {
    flexDirection: "row",
    marginBottom: 14,
  },

  filtre: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 15,
    marginRight: 9,
    backgroundColor: "#FFFFFF",
  },

  filtreActif: {
    backgroundColor: "#F97316",
  },

  filtreTexte: {
    color: "#666666",
    fontWeight: "700",
  },

  filtreTexteActif: {
    color: "#FFFFFF",
  },

  centre: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  liste: {
    paddingBottom: 40,
  },

  carte: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 17,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ECECEC",
    flexDirection: "row",
    alignItems: "center",
  },

  informations: {
    flex: 1,
  },

  nom: {
    color: "#111111",
    fontSize: 17,
    fontWeight: "900",
  },

  cuisine: {
    color: "#777777",
    marginTop: 4,
  },

  badge: {
    alignSelf: "flex-start",
    marginTop: 9,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 11,
  },

  badgeActif: {
    backgroundColor: "#E8F8EC",
  },

  badgeInactif: {
    backgroundColor: "#FFE8E8",
  },

  badgeTexte: {
    fontSize: 11,
    fontWeight: "900",
  },

  badgeTexteActif: {
    color: "#238636",
  },

  badgeTexteInactif: {
    color: "#D93434",
  },

  actions: {
    alignItems: "flex-end",
  },

  boutonEtat: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 12,
    marginBottom: 8,
  },

  boutonNouveau: {
    backgroundColor: palette.orange,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 14,
  },

  boutonNouveauTexte: { color: palette.blanc, fontWeight: "900", fontSize: 15 },

  boutonMenu: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: palette.orange,
  },

  boutonActiver: {
    backgroundColor: "#238636",
  },

  boutonDesactiver: {
    backgroundColor: "#111111",
  },

  boutonEtatTexte: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 12,
  },

  boutonSupprimer: {
    backgroundColor: "#FFE8E8",
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 12,
  },

  boutonSupprimerTexte: {
    color: "#D93434",
    fontWeight: "800",
    fontSize: 11,
  },

  vide: {
    marginTop: 80,
    textAlign: "center",
    color: "#777777",
  },
});