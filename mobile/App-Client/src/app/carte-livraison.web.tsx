import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import { palette } from "../constants/design";

// Version web de l'écran de carte.
//
// Metro résout les extensions de plateforme avant le fichier générique :
// sur le web c'est ce fichier qui est retenu, et « carte-livraison.tsx »
// — qui importe react-native-maps — n'est jamais inclus dans le paquet.
//
// C'est indispensable : react-native-maps importe des modules internes de
// React Native absents du navigateur. Un import conditionnel ne suffirait
// pas, car Metro analyse les require() à la compilation, sans tenir compte
// des conditions d'exécution.
export default function CarteLivraisonWeb() {
  const router = useRouter();

  const { restaurant, adresse } = useLocalSearchParams<{
    restaurant?: string;
    adresse?: string;
  }>();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.entete}>
        <Pressable onPress={() => router.back()} style={styles.retour}>
          <Text style={styles.retourTexte}>← Retour</Text>
        </Pressable>

        <View style={styles.enteteTexte}>
          <Text style={styles.titre}>Carte de livraison</Text>
          <Text style={styles.doux}>
            {restaurant ?? "Restaurant"} → {adresse ?? "Client"}
          </Text>
        </View>
      </View>

      <View style={styles.centre}>
        <Text style={styles.emoji}>🗺️</Text>
        <Text style={styles.titreCentre}>Carte indisponible dans le navigateur</Text>
        <Text style={styles.explication}>
          Le suivi cartographique utilise les services de localisation du
          téléphone. Ouvre Savora sur ton appareil mobile pour voir le trajet
          du livreur en direct.
        </Text>
        <Text style={styles.note}>
          Le reste de l'application fonctionne normalement ici.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.fond },
  entete: { padding: 20, flexDirection: "row", alignItems: "center", gap: 14 },
  retour: {
    paddingVertical: 9,
    paddingHorizontal: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.bordure,
    backgroundColor: palette.blanc,
  },
  retourTexte: { fontWeight: "800", color: palette.texte },
  enteteTexte: { flex: 1 },
  titre: { fontSize: 20, fontWeight: "900", color: palette.texte },
  doux: { color: palette.texteDoux, marginTop: 3 },
  centre: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emoji: { fontSize: 56, marginBottom: 16 },
  titreCentre: {
    fontSize: 22,
    fontWeight: "900",
    color: palette.texte,
    textAlign: "center",
  },
  explication: {
    color: palette.texteDoux,
    textAlign: "center",
    marginTop: 12,
    lineHeight: 22,
    maxWidth: 420,
  },
  note: {
    color: palette.texteDoux,
    textAlign: "center",
    marginTop: 18,
    fontSize: 13,
    fontStyle: "italic",
  },
});
