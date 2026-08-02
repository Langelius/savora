import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { io, Socket } from "socket.io-client";
import { palette } from "../constants/design";
import { useAuth } from "../context/AuthContext";
import { api, Commande } from "../services/api";

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL ?? "http://localhost:3000";
const PROCHAIN_STATUT: Record<string, string | undefined> = {
  "en attente": "confirmée",
  "confirmée": "en préparation",
  "en préparation": "prête",
};

function formatPrix(valeur: number) {
  return `${valeur.toFixed(2).replace(".", ",")} $`;
}

export default function RestaurantDashboard() {
  const router = useRouter();
  const { token, utilisateur, deconnexion } = useAuth();
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [chargement, setChargement] = useState(true);
  const [actualisation, setActualisation] = useState(false);
  const [miseAJourId, setMiseAJourId] = useState<string | null>(null);

  const charger = useCallback(async (silencieux = false) => {
    if (!token) return;
    try {
      if (!silencieux) setChargement(true);
      const resultat = await api.commandes(token);
      setCommandes(resultat.commandes);
    } catch (erreur) {
      Alert.alert("Impossible de charger", erreur instanceof Error ? erreur.message : "Erreur inconnue");
    } finally {
      setChargement(false);
      setActualisation(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token || utilisateur?.role !== "restaurant") {
      router.replace("/login");
      return;
    }
    charger();
  }, [charger, router, token, utilisateur?.role]);

  useEffect(() => {
    if (!token) return;
    const socket: Socket = io(SOCKET_URL, { auth: { token }, transports: ["websocket", "polling"] });
    const synchroniser = (commande: Commande) => {
      setCommandes((courantes) => {
        const existe = courantes.some((item) => item._id === commande._id);
        if (!existe) return [commande, ...courantes];
        return courantes.map((item) => item._id === commande._id ? commande : item);
      });
    };
    socket.on("commande:nouvelle", synchroniser);
    socket.on("commande:mise-a-jour", synchroniser);
    return () => { socket.disconnect(); };
  }, [token]);

  const actives = useMemo(() => commandes.filter((c) => !["livrée", "annulée"].includes(c.statut)), [commandes]);

  const avancer = async (commande: Commande) => {
    const prochain = PROCHAIN_STATUT[commande.statut];
    if (!prochain || !token) return;
    try {
      setMiseAJourId(commande._id);
      const resultat = await api.modifierStatutCommande(token, commande._id, prochain);
      setCommandes((courantes) => courantes.map((item) => item._id === commande._id ? resultat.commande : item));
    } catch (erreur) {
      Alert.alert("Mise à jour impossible", erreur instanceof Error ? erreur.message : "Erreur inconnue");
    } finally {
      setMiseAJourId(null);
    }
  };

  const annuler = (commande: Commande) => {
    if (!token || !["en attente", "confirmée", "en préparation"].includes(commande.statut)) return;
    Alert.alert("Annuler la commande", "Cette action est définitive.", [
      { text: "Retour", style: "cancel" },
      { text: "Annuler la commande", style: "destructive", onPress: async () => {
        try {
          setMiseAJourId(commande._id);
          const resultat = await api.modifierStatutCommande(token, commande._id, "annulée");
          setCommandes((courantes) => courantes.map((item) => item._id === commande._id ? resultat.commande : item));
        } catch (erreur) {
          Alert.alert("Erreur", erreur instanceof Error ? erreur.message : "Erreur inconnue");
        } finally { setMiseAJourId(null); }
      } },
    ]);
  };

  const quitter = () => { deconnexion(); router.replace("/login"); };

  if (chargement) return <SafeAreaView style={styles.centre}><ActivityIndicator size="large" /><Text style={styles.texteDoux}>Chargement des commandes…</Text></SafeAreaView>;

  return <SafeAreaView style={styles.safe}>
    <View style={styles.entete}>
      <View><Text style={styles.surtitre}>ESPACE RESTAURANT</Text><Text style={styles.titre}>Commandes en cuisine</Text><Text style={styles.texteDoux}>{utilisateur?.nom}</Text></View>
      <Pressable onPress={quitter} style={styles.deconnexion}><Text style={styles.deconnexionTexte}>Déconnexion</Text></Pressable>
    </View>
    <View style={styles.resume}>
      <View><Text style={styles.nombre}>{actives.length}</Text><Text style={styles.resumeTexte}>commandes actives</Text></View>
      <View><Text style={styles.nombre}>{commandes.filter((c) => c.statut === "en attente").length}</Text><Text style={styles.resumeTexte}>à confirmer</Text></View>
      <View><Text style={styles.nombre}>{commandes.filter((c) => c.statut === "en préparation").length}</Text><Text style={styles.resumeTexte}>en préparation</Text></View>
    </View>
    <FlatList
      data={commandes}
      keyExtractor={(item) => item._id}
      contentContainerStyle={styles.liste}
      refreshControl={<RefreshControl refreshing={actualisation} onRefresh={() => { setActualisation(true); charger(true); }} />}
      ListEmptyComponent={<View style={styles.vide}><Text style={styles.videTitre}>Aucune commande</Text><Text style={styles.texteDoux}>Les nouvelles commandes apparaîtront ici en temps réel.</Text></View>}
      renderItem={({ item }) => {
        const prochain = PROCHAIN_STATUT[item.statut];
        const enCours = miseAJourId === item._id;
        return <View style={styles.carte}>
          <View style={styles.ligneHaut}><Text style={styles.numero}>#{item._id.slice(-6).toUpperCase()}</Text><View style={styles.badge}><Text style={styles.badgeTexte}>{item.statut}</Text></View></View>
          <Text style={styles.client}>{item.utilisateurId?.nom ?? "Client"}</Text>
          <Text style={styles.adresse}>{item.adresseLivraison}</Text>
          <View style={styles.separateur} />
          {item.plats.map((plat) => <View key={`${item._id}-${plat.platId}`} style={styles.plat}><Text style={styles.quantite}>{plat.quantite}×</Text><Text style={styles.platNom}>{plat.nom}</Text><Text style={styles.prix}>{formatPrix(plat.prix * plat.quantite)}</Text></View>)}
          <View style={styles.total}><Text style={styles.totalLabel}>Total</Text><Text style={styles.totalPrix}>{formatPrix(item.total)}</Text></View>
          {prochain && <Pressable disabled={enCours} onPress={() => avancer(item)} style={[styles.action, enCours && styles.actionInactive]}><Text style={styles.actionTexte}>{enCours ? "Mise à jour…" : `Passer à « ${prochain} »`}</Text></Pressable>}
          {["en attente", "confirmée", "en préparation"].includes(item.statut) && <Pressable disabled={enCours} onPress={() => annuler(item)}><Text style={styles.annuler}>Annuler la commande</Text></Pressable>}
        </View>;
      }}
    />
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.fond }, centre: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, backgroundColor: palette.fond },
  entete: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }, surtitre: { fontSize: 11, letterSpacing: 2, fontWeight: "900", color: palette.orangeFonce }, titre: { fontSize: 28, fontWeight: "900", color: palette.texte, marginTop: 4 }, texteDoux: { color: palette.texteDoux, marginTop: 4 }, deconnexion: { borderWidth: 1, borderColor: palette.bordure, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9 }, deconnexionTexte: { fontWeight: "800", color: palette.texte },
  resume: { marginHorizontal: 20, backgroundColor: palette.blanc, borderRadius: 20, padding: 18, flexDirection: "row", justifyContent: "space-between", borderWidth: 1, borderColor: palette.bordure }, nombre: { fontSize: 24, fontWeight: "900", color: palette.texte }, resumeTexte: { color: palette.texteDoux, fontSize: 12, marginTop: 2 }, liste: { padding: 20, paddingBottom: 40 },
  carte: { backgroundColor: palette.blanc, borderRadius: 22, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: palette.bordure }, ligneHaut: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, numero: { fontWeight: "900", fontSize: 16, color: palette.texte }, badge: { backgroundColor: "#FFF0E4", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 }, badgeTexte: { color: palette.orangeFonce, fontWeight: "800", fontSize: 12 }, client: { fontSize: 18, fontWeight: "900", marginTop: 14, color: palette.texte }, adresse: { color: palette.texteDoux, marginTop: 4 }, separateur: { height: 1, backgroundColor: palette.bordure, marginVertical: 14 }, plat: { flexDirection: "row", alignItems: "center", marginBottom: 10 }, quantite: { width: 30, fontWeight: "900", color: palette.orangeFonce }, platNom: { flex: 1, color: palette.texte }, prix: { fontWeight: "800", color: palette.texte }, total: { flexDirection: "row", justifyContent: "space-between", marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: palette.bordure }, totalLabel: { fontWeight: "800" }, totalPrix: { fontSize: 18, fontWeight: "900" }, action: { backgroundColor: palette.orange, borderRadius: 15, paddingVertical: 14, alignItems: "center", marginTop: 16 }, actionInactive: { opacity: 0.55 }, actionTexte: { color: palette.blanc, fontWeight: "900" }, annuler: { textAlign: "center", color: "#B42318", fontWeight: "800", marginTop: 14 }, vide: { alignItems: "center", paddingVertical: 70 }, videTitre: { fontSize: 22, fontWeight: "900", color: palette.texte, marginBottom: 8 },
});
