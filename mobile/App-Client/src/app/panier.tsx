import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { usePanier } from "../context/PanierContext";
import { BoutonPrincipal } from "../components/BoutonPrincipal";
import { Entete } from "../components/Entete";
import { palette } from "../constants/design";

export default function Panier() {
  const router = useRouter();
  const { lignes, restaurant, sousTotal, ajouter, diminuer, retirer } = usePanier();
  const frais = restaurant?.fraisLivraison ?? 0;

  if (lignes.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.page}>
          <Entete titre="Mon panier" retour />
          <View style={styles.vide}>
            <Text style={styles.emoji}>🛒</Text>
            <Text style={styles.titreVide}>Ton panier est vide</Text>
            <BoutonPrincipal
              titre="Voir les restaurants"
              onPress={() => router.replace("/restaurants")}
              style={{ marginTop: 22 }}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page}>
        <Entete titre="Mon panier" retour />
        <Text style={styles.resto}>{restaurant?.nom}</Text>

        {lignes.map((ligne) => (
          <View key={ligne.cle} style={styles.ligne}>
            <Image source={{ uri: ligne.plat.image }} style={styles.image} />

            <View style={{ flex: 1 }}>
              <Text style={styles.nom}>{ligne.plat.nom}</Text>

              {ligne.options.length > 0 && (
                <Text style={styles.options}>{ligne.options.join(" · ")}</Text>
              )}

              <Text style={styles.prix}>
                {(ligne.prixUnitaire * ligne.quantite).toFixed(2)} $
              </Text>

              <View style={styles.quantite}>
                <Pressable onPress={() => diminuer(ligne.cle)} style={styles.rond}>
                  <Text style={styles.signe}>−</Text>
                </Pressable>

                <Text style={styles.nombre}>{ligne.quantite}</Text>

                <Pressable
                  onPress={() => restaurant && ajouter(ligne.plat, restaurant, ligne.options)}
                  style={styles.rond}
                >
                  <Text style={styles.signe}>+</Text>
                </Pressable>

                <Pressable onPress={() => retirer(ligne.cle)}>
                  <Text style={styles.retirer}>Retirer</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ))}

        <View style={styles.resume}>
          <View style={styles.resumeLigne}>
            <Text>Sous-total</Text>
            <Text>{sousTotal.toFixed(2)} $</Text>
          </View>
          <View style={styles.resumeLigne}>
            <Text>Livraison</Text>
            <Text>{frais.toFixed(2)} $</Text>
          </View>
          <Text style={styles.mention}>Les taxes sont calculées à l'étape du paiement.</Text>
        </View>

        <BoutonPrincipal
          titre="Passer au paiement"
          onPress={() => router.push("/paiement")}
          style={{ marginTop: 22 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.fond },
  page: { padding: 20, paddingBottom: 40 },
  resto: { fontSize: 20, fontWeight: "900", marginVertical: 18 },
  ligne: {
    backgroundColor: palette.blanc,
    borderRadius: 18,
    padding: 12,
    marginBottom: 12,
    flexDirection: "row",
    borderWidth: 1,
    borderColor: palette.bordure,
  },
  image: { width: 88, height: 88, borderRadius: 14, marginRight: 12 },
  nom: { fontSize: 16, fontWeight: "900" },
  options: { color: palette.texteDoux, fontSize: 13, marginTop: 3 },
  prix: { fontWeight: "800", marginTop: 5 },
  quantite: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 12 },
  rond: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F2E8DE",
    alignItems: "center",
    justifyContent: "center",
  },
  signe: { fontSize: 16, fontWeight: "900" },
  nombre: { fontWeight: "900" },
  retirer: { color: palette.danger, fontWeight: "700", marginLeft: 8 },
  resume: { marginTop: 18, padding: 18, backgroundColor: palette.blanc, borderRadius: 18 },
  resumeLigne: { flexDirection: "row", justifyContent: "space-between", marginVertical: 5 },
  mention: { color: palette.texteDoux, fontSize: 12, marginTop: 10 },
  vide: { alignItems: "center", marginTop: 100 },
  emoji: { fontSize: 48 },
  titreVide: { fontSize: 24, fontWeight: "900", marginTop: 12 },
});
