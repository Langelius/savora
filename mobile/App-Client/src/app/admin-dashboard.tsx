import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { api, StatistiquesAdmin } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function AdminDashboard() {
  const router = useRouter();
  const { token, utilisateur, deconnexion } = useAuth();
  const [statistiques, setStatistiques] = useState<StatistiquesAdmin | null>(null);
  const [chargement, setChargement] = useState(true);
  const [actualisation, setActualisation] = useState(false);

  const charger = useCallback(async () => {
    if (!token) {
      setChargement(false);
      return;
    }

    try {
      const resultat = await api.statistiquesAdmin(token);
      setStatistiques(resultat.statistiques);
    } catch (erreur) {
      Alert.alert(
        "Erreur",
        erreur instanceof Error
          ? erreur.message
          : "Impossible de charger le tableau de bord."
      );
    } finally {
      setChargement(false);
      setActualisation(false);
    }
  }, [token]);

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

  const seDeconnecter = () => {
    deconnexion();
    router.replace("/login");
  };

  if (chargement) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centre}>
          <ActivityIndicator size="large" />
          <Text style={styles.texteDoux}>Chargement du tableau de bord...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!statistiques) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centre}>
          <Text style={styles.titreErreur}>Statistiques indisponibles</Text>
          <Pressable style={styles.boutonOrange} onPress={charger}>
            <Text style={styles.boutonOrangeTexte}>Réessayer</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.page}
        refreshControl={
          <RefreshControl
            refreshing={actualisation}
            onRefresh={() => {
              setActualisation(true);
              charger();
            }}
          />
        }
      >
        <View style={styles.entete}>
          <View>
            <Text style={styles.logo}>SAVORA ADMIN</Text>
            <Text style={styles.titre}>Tableau de bord</Text>
            <Text style={styles.texteDoux}>Bienvenue, {utilisateur?.nom}</Text>
          </View>
          <Pressable onPress={seDeconnecter} style={styles.deconnexion}>
            <Text style={styles.deconnexionTexte}>Quitter</Text>
          </Pressable>
        </View>

        <View style={styles.grille}>
          <Carte titre="Utilisateurs" valeur={statistiques.utilisateurs.total} detail={`${statistiques.utilisateurs.clients} clients`} />
          <Carte titre="Livreurs" valeur={statistiques.utilisateurs.livreurs} detail="Comptes livreurs" />
          <Carte titre="Restaurants" valeur={statistiques.restaurants.total} detail={`${statistiques.restaurants.actifs} actifs`} />
          <Carte titre="Commandes" valeur={statistiques.commandes.total} detail={`${statistiques.commandes.enRoute} en route`} />
        </View>

        <View style={styles.revenus}>
          <Text style={styles.revenusLabel}>REVENUS DES COMMANDES LIVRÉES</Text>
          <Text style={styles.revenusValeur}>{statistiques.revenusTotaux.toFixed(2)} $</Text>
        </View>

        <Text style={styles.sectionTitre}>État des commandes</Text>
        <View style={styles.carteEtat}>
          <Ligne libelle="En attente" valeur={statistiques.commandes.enAttente} />
          <Ligne libelle="En préparation" valeur={statistiques.commandes.enPreparation} />
          <Ligne libelle="En route" valeur={statistiques.commandes.enRoute} />
          <Ligne libelle="Livrées" valeur={statistiques.commandes.livrees} />
          <Ligne libelle="Annulées" valeur={statistiques.commandes.annulees} />
        </View>

        <Text style={styles.sectionTitre}>Gestion</Text>
        <Action titre="Gérer les utilisateurs" description="Modifier les rôles et supprimer des comptes" onPress={() => router.push("/admin-utilisateurs")} />
        <Action titre="Gérer les restaurants" description="Activer, désactiver ou supprimer un restaurant" onPress={() => router.push("/admin-restaurants")} />
        <Action titre="Voir les commandes" description="Consulter et annuler les commandes" onPress={() => router.push("/admin-commandes")} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Carte({ titre, valeur, detail }: { titre: string; valeur: number; detail: string }) {
  return (
    <View style={styles.carteStatistique}>
      <Text style={styles.carteTitre}>{titre}</Text>
      <Text style={styles.carteValeur}>{valeur}</Text>
      <Text style={styles.carteDetail}>{detail}</Text>
    </View>
  );
}

function Ligne({ libelle, valeur }: { libelle: string; valeur: number }) {
  return (
    <View style={styles.ligne}>
      <Text style={styles.ligneLibelle}>{libelle}</Text>
      <Text style={styles.ligneValeur}>{valeur}</Text>
    </View>
  );
}

function Action({ titre, description, onPress }: { titre: string; description: string; onPress: () => void }) {
  return (
    <Pressable style={styles.action} onPress={onPress}>
      <View style={{ flex: 1 }}>
        <Text style={styles.actionTitre}>{titre}</Text>
        <Text style={styles.actionDescription}>{description}</Text>
      </View>
      <Text style={styles.fleche}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F7F7F7" },
  page: { padding: 20, paddingBottom: 50 },
  centre: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  texteDoux: { color: "#737373", marginTop: 6 },
  titreErreur: { fontSize: 21, fontWeight: "900", marginBottom: 18 },
  boutonOrange: { backgroundColor: "#F97316", borderRadius: 14, paddingHorizontal: 24, paddingVertical: 13 },
  boutonOrangeTexte: { color: "white", fontWeight: "900" },
  entete: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginTop: 10, marginBottom: 24 },
  logo: { color: "#F97316", fontSize: 13, fontWeight: "900", letterSpacing: 2 },
  titre: { color: "#111", fontSize: 31, fontWeight: "900", marginTop: 6 },
  deconnexion: { backgroundColor: "#FFF0E6", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 13 },
  deconnexionTexte: { color: "#F97316", fontWeight: "900" },
  grille: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  carteStatistique: { width: "48%", backgroundColor: "white", borderRadius: 19, padding: 17, marginBottom: 13, borderWidth: 1, borderColor: "#EAEAEA" },
  carteTitre: { color: "#777", fontWeight: "700" },
  carteValeur: { fontSize: 30, fontWeight: "900", color: "#111", marginTop: 9 },
  carteDetail: { color: "#999", fontSize: 12, marginTop: 4 },
  revenus: { backgroundColor: "#F97316", borderRadius: 21, padding: 21, marginTop: 5 },
  revenusLabel: { color: "white", fontSize: 12, fontWeight: "900", letterSpacing: 1 },
  revenusValeur: { color: "white", fontSize: 35, fontWeight: "900", marginTop: 8 },
  sectionTitre: { fontSize: 20, fontWeight: "900", color: "#111", marginTop: 28, marginBottom: 11 },
  carteEtat: { backgroundColor: "white", borderRadius: 19, paddingHorizontal: 17, borderWidth: 1, borderColor: "#EAEAEA" },
  ligne: { minHeight: 52, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#EFEFEF" },
  ligneLibelle: { color: "#333", fontSize: 15 },
  ligneValeur: { backgroundColor: "#FFF0E6", color: "#F97316", fontWeight: "900", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 11 },
  action: { backgroundColor: "white", borderRadius: 17, padding: 17, marginBottom: 11, borderWidth: 1, borderColor: "#EAEAEA", flexDirection: "row", alignItems: "center" },
  actionTitre: { fontSize: 16, fontWeight: "900", color: "#111" },
  actionDescription: { color: "#777", marginTop: 4, lineHeight: 19 },
  fleche: { color: "#F97316", fontSize: 31, marginLeft: 10 },
});
