import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { api, Commande } from "../services/api";
import { useAuth } from "../context/AuthContext";

const STATUTS = [
  "",
  "en attente",
  "confirmée",
  "en préparation",
  "prête",
  "prise en charge",
  "en route",
  "livrée",
  "annulée",
];

export default function AdminCommandes() {
  const router = useRouter();
  const { token, utilisateur } = useAuth();
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [statut, setStatut] = useState("");
  const [chargement, setChargement] = useState(true);

  const charger = useCallback(async () => {
    if (!token) {
      setChargement(false);
      return;
    }

    try {
      setChargement(true);
      const resultat = await api.commandesAdmin(token, statut);
      setCommandes(resultat.commandes);
    } catch (erreur) {
      Alert.alert(
        "Erreur",
        erreur instanceof Error ? erreur.message : "Impossible de charger les commandes."
      );
    } finally {
      setChargement(false);
    }
  }, [token, statut]);

  useEffect(() => {
    if (!token) {
      router.replace("/login");
      return;
    }

    if (utilisateur?.role !== "admin") {
      router.replace("/restaurants");
      return;
    }

    charger();
  }, [token, utilisateur, charger, router]);

  const annuler = (commande: Commande) => {
    Alert.alert(
      "Annuler la commande",
      `Confirmer l'annulation de la commande #${commande._id.slice(-6).toUpperCase()} ?`,
      [
        { text: "Non", style: "cancel" },
        {
          text: "Oui, annuler",
          style: "destructive",
          onPress: async () => {
            if (!token) return;
            try {
              const resultat = await api.annulerCommandeAdmin(token, commande._id);
              setCommandes((liste) =>
                liste.map((element) =>
                  element._id === commande._id ? resultat.commande : element
                )
              );
            } catch (erreur) {
              Alert.alert(
                "Erreur",
                erreur instanceof Error ? erreur.message : "Impossible d'annuler la commande."
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
          <Pressable onPress={() => router.back()} style={styles.retour}>
            <Text style={styles.retourTexte}>‹</Text>
          </Pressable>
          <View>
            <Text style={styles.titre}>Commandes</Text>
            <Text style={styles.sousTitre}>Toutes les commandes Savora</Text>
          </View>
        </View>

        <FlatList
          horizontal
          data={STATUTS}
          keyExtractor={(item) => item || "toutes"}
          showsHorizontalScrollIndicator={false}
          style={styles.listeFiltres}
          contentContainerStyle={styles.filtres}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setStatut(item)}
              style={[styles.filtre, statut === item && styles.filtreActif]}
            >
              <Text style={[styles.filtreTexte, statut === item && styles.filtreTexteActif]}>
                {item || "Toutes"}
              </Text>
            </Pressable>
          )}
        />

        {chargement ? (
          <View style={styles.centre}>
            <ActivityIndicator size="large" />
          </View>
        ) : (
          <FlatList
            data={commandes}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.liste}
            onRefresh={charger}
            refreshing={chargement}
            ListEmptyComponent={<Text style={styles.vide}>Aucune commande trouvée.</Text>}
            renderItem={({ item }) => {
              const peutAnnuler = item.statut !== "livrée" && item.statut !== "annulée";
              return (
                <View style={styles.carte}>
                  <View style={styles.ligneHaut}>
                    <Text style={styles.numero}>#{item._id.slice(-6).toUpperCase()}</Text>
                    <View style={styles.badge}>
                      <Text style={styles.badgeTexte}>{item.statut}</Text>
                    </View>
                  </View>

                  <Text style={styles.restaurant}>{item.restaurantId?.nom ?? "Restaurant"}</Text>
                  <Text style={styles.detail}>Client : {item.utilisateurId?.nom ?? "Non disponible"}</Text>
                  <Text style={styles.detail}>Adresse : {item.adresseLivraison}</Text>
                  <Text style={styles.detail}>Articles : {item.plats.reduce((total, plat) => total + plat.quantite, 0)}</Text>

                  <View style={styles.basCarte}>
                    <Text style={styles.total}>{Number(item.total).toFixed(2)} $</Text>
                    {peutAnnuler && (
                      <Pressable style={styles.boutonAnnuler} onPress={() => annuler(item)}>
                        <Text style={styles.boutonAnnulerTexte}>Annuler</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              );
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F7F7F7" },
  page: { flex: 1, paddingHorizontal: 20 },
  entete: { marginTop: 15, marginBottom: 15, flexDirection: "row", alignItems: "center" },
  retour: { width: 45, height: 45, marginRight: 12, borderRadius: 15, backgroundColor: "white", justifyContent: "center", alignItems: "center" },
  retourTexte: { color: "#F97316", fontSize: 34, lineHeight: 38 },
  titre: { fontSize: 29, fontWeight: "900", color: "#111" },
  sousTitre: { color: "#777", marginTop: 3 },
  listeFiltres: { flexGrow: 0, marginBottom: 12 },
  filtres: { paddingRight: 10 },
  filtre: { backgroundColor: "white", paddingHorizontal: 14, paddingVertical: 9, borderRadius: 15, marginRight: 8 },
  filtreActif: { backgroundColor: "#F97316" },
  filtreTexte: { color: "#666", fontWeight: "700", textTransform: "capitalize" },
  filtreTexteActif: { color: "white" },
  centre: { flex: 1, justifyContent: "center", alignItems: "center" },
  liste: { paddingBottom: 40 },
  vide: { textAlign: "center", color: "#777", marginTop: 80 },
  carte: { backgroundColor: "white", borderRadius: 19, padding: 17, marginBottom: 12, borderWidth: 1, borderColor: "#ECECEC" },
  ligneHaut: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  numero: { fontWeight: "900", color: "#111", fontSize: 16 },
  badge: { backgroundColor: "#FFF0E6", borderRadius: 11, paddingHorizontal: 9, paddingVertical: 5 },
  badgeTexte: { color: "#F97316", fontWeight: "900", fontSize: 11, textTransform: "capitalize" },
  restaurant: { fontSize: 18, fontWeight: "900", color: "#111", marginTop: 14 },
  detail: { color: "#666", marginTop: 6, lineHeight: 19 },
  basCarte: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 16 },
  total: { fontSize: 20, fontWeight: "900", color: "#111" },
  boutonAnnuler: { backgroundColor: "#FFE8E8", borderRadius: 12, paddingHorizontal: 15, paddingVertical: 9 },
  boutonAnnulerTexte: { color: "#D93434", fontWeight: "900" },
});
