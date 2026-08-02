import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";

import { useAuth } from "../context/AuthContext";
import { api, Commande } from "../services/api";
import { palette } from "../constants/design";

export default function Profil() {
  const router = useRouter();
  const { token, utilisateur, deconnexion } = useAuth();

  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [chargement, setChargement] = useState(false);

  // useFocusEffect plutôt que useEffect : l'historique se rafraîchit au
  // retour sur l'écran, après une nouvelle commande ou une notation.
  useFocusEffect(
    useCallback(() => {
      if (!token) return;

      let actif = true;
      setChargement(true);

      api
        .commandes(token)
        .then((resultat) => {
          if (actif) setCommandes(resultat.commandes);
        })
        .catch((erreur) =>
          Alert.alert("Erreur", erreur instanceof Error ? erreur.message : "Erreur")
        )
        .finally(() => {
          if (actif) setChargement(false);
        });

      return () => {
        actif = false;
      };
    }, [token])
  );

  if (!token) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centre}>
          <Text style={styles.titre}>Connecte-toi à Savora</Text>
          <Text style={styles.doux}>Ton historique et ton profil apparaîtront ici.</Text>
          <Pressable style={styles.bouton} onPress={() => router.push("/login")}>
            <Text style={styles.boutonTexte}>Se connecter</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.page}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.retour}>‹</Text>
        </Pressable>

        <Text style={styles.titre}>{utilisateur?.nom}</Text>
        <Text style={styles.doux}>{utilisateur?.courriel}</Text>

        <Text style={styles.section}>Mes commandes</Text>

        {chargement ? (
          <ActivityIndicator />
        ) : (
          <FlatList
            data={commandes}
            keyExtractor={(commande) => commande._id}
            ListEmptyComponent={<Text style={styles.doux}>Aucune commande pour le moment.</Text>}
            renderItem={({ item }) => (
              <Pressable
                style={styles.commande}
                onPress={() => router.push({ pathname: "/suivi", params: { id: item._id } })}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.nom}>{item.restaurantId?.nom ?? "Restaurant"}</Text>
                  <Text style={styles.doux}>
                    {new Date(item.createdAt).toLocaleDateString("fr-CA")} · {item.statut}
                  </Text>
                  {item.statut === "livrée" && !item.avisDepose && (
                    <Text style={styles.aNoter}>À noter</Text>
                  )}
                </View>
                <Text style={styles.nom}>{item.total.toFixed(2)} $</Text>
              </Pressable>
            )}
          />
        )}

        <Pressable
          onPress={async () => {
            await deconnexion();
            router.replace("/");
          }}
        >
          <Text style={styles.deconnexion}>Se déconnecter</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.fond },
  page: { flex: 1, padding: 24 },
  centre: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  retour: { fontSize: 38 },
  titre: { fontSize: 30, fontWeight: "900", marginTop: 18 },
  doux: { color: palette.texteDoux, marginTop: 6 },
  section: { fontSize: 21, fontWeight: "900", marginTop: 32, marginBottom: 12 },
  commande: {
    backgroundColor: palette.blanc,
    borderRadius: 17,
    padding: 16,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: palette.bordure,
  },
  nom: { fontWeight: "900" },
  aNoter: { color: palette.orangeFonce, fontWeight: "800", fontSize: 12, marginTop: 5 },
  bouton: {
    backgroundColor: palette.orange,
    borderRadius: 18,
    padding: 17,
    marginTop: 24,
    minWidth: 220,
  },
  boutonTexte: { color: palette.blanc, fontWeight: "900", textAlign: "center" },
  deconnexion: { color: palette.danger, fontWeight: "800", textAlign: "center", marginTop: 25 },
});
