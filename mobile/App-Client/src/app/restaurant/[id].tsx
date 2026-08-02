import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import { api, Plat, Restaurant } from "../../services/api";
import { usePanier } from "../../context/PanierContext";
import { palette } from "../../constants/design";

export default function RestaurantDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { ajouter, quantiteTotale } = usePanier();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [plats, setPlats] = useState<Plat[]>([]);
  const [chargement, setChargement] = useState(true);

  // Plat en cours de personnalisation (fonctionnalité 1 du cahier des charges).
  const [platChoisi, setPlatChoisi] = useState<Plat | null>(null);
  const [optionsChoisies, setOptionsChoisies] = useState<string[]>([]);

  useEffect(() => {
    if (!id) return;

    api
      .restaurant(id)
      .then((resultat) => {
        setRestaurant(resultat.restaurant);
        setPlats(resultat.plats);
      })
      .catch((erreur) =>
        Alert.alert("Erreur", erreur instanceof Error ? erreur.message : "Erreur")
      )
      .finally(() => setChargement(false));
  }, [id]);

  const ouvrirPlat = (plat: Plat) => {
    // Sans option à choisir, l'ajout reste direct : pas de fenêtre inutile.
    if (!plat.options || plat.options.length === 0) {
      if (restaurant) ajouter(plat, restaurant, []);
      return;
    }

    setPlatChoisi(plat);
    setOptionsChoisies([]);
  };

  const basculerOption = (nom: string) => {
    setOptionsChoisies((actuelles) =>
      actuelles.includes(nom)
        ? actuelles.filter((option) => option !== nom)
        : [...actuelles, nom]
    );
  };

  const prixAvecOptions = (plat: Plat) => {
    let prix = plat.prix;
    for (const option of plat.options ?? []) {
      if (optionsChoisies.includes(option.nom)) prix += option.prix;
    }
    return prix;
  };

  const confirmerPersonnalisation = () => {
    if (platChoisi && restaurant) ajouter(platChoisi, restaurant, optionsChoisies);
    setPlatChoisi(null);
    setOptionsChoisies([]);
  };

  if (chargement || !restaurant) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator size="large" style={{ marginTop: 100 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={plats}
        keyExtractor={(plat) => plat._id}
        contentContainerStyle={{ paddingBottom: 110 }}
        ListHeaderComponent={
          <>
            <Image source={{ uri: restaurant.image }} style={styles.hero} />
            <Pressable onPress={() => router.back()} style={styles.retour}>
              <Text style={styles.fleche}>‹</Text>
            </Pressable>

            <View style={styles.intro}>
              <Text style={styles.nom}>{restaurant.nom}</Text>
              <Text style={styles.doux}>
                {restaurant.cuisine} · ★ {restaurant.note.toFixed(1)}
                {restaurant.nombreAvis ? ` (${restaurant.nombreAvis} avis)` : " (aucun avis)"} ·{" "}
                {restaurant.delai}
              </Text>
              <Text style={styles.description}>{restaurant.description}</Text>
              <Text style={styles.menu}>Menu</Text>
            </View>
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.plat}>
            <Image source={{ uri: item.image }} style={styles.imagePlat} />

            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.nomPlat}>{item.nom}</Text>
              <Text style={styles.doux} numberOfLines={2}>
                {item.description}
              </Text>
              <Text style={styles.prix}>{item.prix.toFixed(2)} $</Text>
              {item.options && item.options.length > 0 && (
                <Text style={styles.personnalisable}>Personnalisable</Text>
              )}
            </View>

            <Pressable onPress={() => ouvrirPlat(item)} style={styles.plus}>
              <Text style={styles.plusTexte}>+</Text>
            </Pressable>
          </View>
        )}
      />

      {quantiteTotale > 0 && (
        <Pressable style={styles.panier} onPress={() => router.push("/panier")}>
          <Text style={styles.panierTexte}>Voir le panier · {quantiteTotale}</Text>
        </Pressable>
      )}

      <Modal visible={platChoisi !== null} animationType="slide" transparent>
        <View style={styles.voile}>
          <View style={styles.feuille}>
            <Text style={styles.titreFeuille}>{platChoisi?.nom}</Text>
            <Text style={styles.doux}>Choisis tes options, puis ajoute au panier.</Text>

            <ScrollView style={styles.listeOptions}>
              {(platChoisi?.options ?? []).map((option) => {
                const active = optionsChoisies.includes(option.nom);
                return (
                  <Pressable
                    key={option.nom}
                    onPress={() => basculerOption(option.nom)}
                    style={[styles.option, active && styles.optionActive]}
                  >
                    <Text style={styles.optionNom}>{option.nom}</Text>
                    <Text style={styles.optionPrix}>
                      {option.prix > 0 ? `+ ${option.prix.toFixed(2)} $` : "inclus"}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.actions}>
              <Pressable onPress={() => setPlatChoisi(null)} style={styles.annuler}>
                <Text style={styles.annulerTexte}>Annuler</Text>
              </Pressable>

              <Pressable onPress={confirmerPersonnalisation} style={styles.confirmer}>
                <Text style={styles.confirmerTexte}>
                  Ajouter · {platChoisi ? prixAvecOptions(platChoisi).toFixed(2) : "0.00"} $
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.fond },
  hero: { width: "100%", height: 240 },
  retour: {
    position: "absolute",
    top: 18,
    left: 18,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.blanc,
    alignItems: "center",
    justifyContent: "center",
  },
  fleche: { fontSize: 28 },
  intro: { padding: 20 },
  nom: { fontSize: 30, fontWeight: "900" },
  doux: { color: palette.texteDoux, marginTop: 5, lineHeight: 20 },
  description: { marginTop: 12, lineHeight: 21 },
  menu: { fontSize: 22, fontWeight: "900", marginTop: 24 },
  plat: {
    marginHorizontal: 20,
    marginBottom: 14,
    backgroundColor: palette.blanc,
    borderRadius: 18,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: palette.bordure,
  },
  imagePlat: { width: 90, height: 90, borderRadius: 14, marginRight: 12 },
  nomPlat: { fontSize: 16, fontWeight: "900" },
  prix: { fontWeight: "900", marginTop: 8 },
  personnalisable: { color: palette.orangeFonce, fontSize: 12, fontWeight: "800", marginTop: 4 },
  plus: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: palette.orange,
    alignItems: "center",
    justifyContent: "center",
  },
  plusTexte: { color: palette.blanc, fontSize: 22 },
  panier: {
    position: "absolute",
    bottom: 22,
    left: 20,
    right: 20,
    padding: 17,
    borderRadius: 18,
    backgroundColor: palette.orange,
  },
  panierTexte: { color: palette.blanc, fontWeight: "900", textAlign: "center" },

  voile: { flex: 1, backgroundColor: "rgba(20,14,9,0.5)", justifyContent: "flex-end" },
  feuille: {
    backgroundColor: palette.fond,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 22,
    maxHeight: "78%",
  },
  titreFeuille: { fontSize: 24, fontWeight: "900" },
  listeOptions: { marginTop: 18 },
  option: {
    backgroundColor: palette.blanc,
    borderWidth: 1,
    borderColor: palette.bordure,
    borderRadius: 16,
    padding: 15,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  optionActive: { borderColor: palette.orange, backgroundColor: "#FFF1E5" },
  optionNom: { fontWeight: "800" },
  optionPrix: { color: palette.texteDoux, fontWeight: "700" },
  actions: { flexDirection: "row", gap: 12, marginTop: 12 },
  annuler: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.bordure,
    alignItems: "center",
  },
  annulerTexte: { fontWeight: "800" },
  confirmer: {
    flex: 2,
    padding: 16,
    borderRadius: 16,
    backgroundColor: palette.orange,
    alignItems: "center",
  },
  confirmerTexte: { color: palette.blanc, fontWeight: "900" },
});
