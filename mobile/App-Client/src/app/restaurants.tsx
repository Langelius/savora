import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { api, Restaurant } from "../services/api";
import { palette } from "../constants/design";
import { usePanier } from "../context/PanierContext";

export default function Restaurants() {
  const router = useRouter();
  const { quantiteTotale } = usePanier();

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [recherche, setRecherche] = useState("");
  const [chargement, setChargement] = useState(true);

  const charger = async (q = "") => {
    try {
      setChargement(true);

      const resultat = await api.restaurants(q);
      setRestaurants(resultat.restaurants);
    } catch (erreur) {
      Alert.alert(
        "Serveur inaccessible",
        `${
          erreur instanceof Error ? erreur.message : "Erreur inconnue"
        }\n\nVérifie EXPO_PUBLIC_API_URL et démarre le backend.`
      );
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    charger();
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.entete}>
        <View>
          <Text style={styles.logo}>SAVORA.</Text>
          <Text style={styles.titre}>Qu’est-ce qu’on mange ?</Text>
        </View>

        <Pressable
          onPress={() => router.push("/profil")}
          style={styles.avatar}
        >
          <Text>👤</Text>
        </Pressable>
      </View>

      <View style={styles.recherche}>
        <TextInput
          value={recherche}
          onChangeText={setRecherche}
          onSubmitEditing={() => charger(recherche)}
          placeholder="Restaurant ou cuisine"
          style={styles.champRecherche}
          returnKeyType="search"
        />

        <Pressable onPress={() => charger(recherche)}>
          <Text>⌕</Text>
        </Pressable>
      </View>

      {chargement ? (
        <ActivityIndicator size="large" style={styles.chargement} />
      ) : (
        <FlatList
          data={restaurants}
          keyExtractor={(restaurant) => restaurant._id}
          contentContainerStyle={styles.liste}
          ListEmptyComponent={
            <Text style={styles.vide}>Aucun restaurant trouvé.</Text>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/restaurant/[id]",
                  params: { id: item._id },
                })
              }
              style={styles.carte}
            >
              <Image source={{ uri: item.image }} style={styles.image} />

              <View style={styles.info}>
                <Text style={styles.nom}>{item.nom}</Text>
                <Text style={styles.doux}>{item.cuisine}</Text>

                <View style={styles.ligne}>
                  <Text>★ {item.note.toFixed(1)}</Text>
                  <Text>{item.delai}</Text>
                  <Text>{item.fraisLivraison.toFixed(2)} $</Text>
                </View>
              </View>
            </Pressable>
          )}
        />
      )}

      {quantiteTotale > 0 && (
        <Pressable
          style={styles.panier}
          onPress={() => router.push("/panier")}
        >
          <Text style={styles.panierTexte}>
            Voir le panier · {quantiteTotale}
          </Text>
        </Pressable>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: palette.fond,
  },

  entete: {
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  logo: {
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 3,
  },

  titre: {
    fontSize: 27,
    fontWeight: "900",
    marginTop: 8,
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.blanc,
    alignItems: "center",
    justifyContent: "center",
  },

  recherche: {
    marginHorizontal: 20,
    backgroundColor: palette.blanc,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: palette.bordure,
  },

  champRecherche: {
    flex: 1,
  },

  chargement: {
    marginTop: 60,
  },

  liste: {
    padding: 20,
    paddingBottom: 110,
  },

  carte: {
    backgroundColor: palette.blanc,
    borderRadius: 22,
    overflow: "hidden",
    marginBottom: 18,
    borderWidth: 1,
    borderColor: palette.bordure,
  },

  image: {
    height: 180,
    width: "100%",
  },

  info: {
    padding: 16,
  },

  nom: {
    fontSize: 20,
    fontWeight: "900",
  },

  doux: {
    color: palette.texteDoux,
    marginTop: 4,
  },

  ligne: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
  },

  panier: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 22,
    backgroundColor: palette.orange,
    borderRadius: 18,
    padding: 17,
  },

  panierTexte: {
    color: "white",
    fontWeight: "900",
    textAlign: "center",
  },

  vide: {
    textAlign: "center",
    marginTop: 50,
    color: palette.texteDoux,
  },
});