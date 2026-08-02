import { useState } from "react";
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { Entete } from "../components/Entete";
import { BoutonPrincipal } from "../components/BoutonPrincipal";
import { usePanier } from "../context/PanierContext";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { palette } from "../constants/design";

export default function Paiement() {
  const router = useRouter();
  const { lignes, restaurant, sousTotal, vider } = usePanier();
  const { token } = useAuth();
  const [adresse, setAdresse] = useState("");
  const [methode, setMethode] = useState<"carte" | "livraison">("carte");
  const [titulaire, setTitulaire] = useState("");
  const [numero, setNumero] = useState("");
  const [expiration, setExpiration] = useState("");
  const [cvv, setCvv] = useState("");
  const [chargement, setChargement] = useState(false);
  const frais = restaurant?.fraisLivraison ?? 0;
  const taxes = Number((sousTotal * 0.14975).toFixed(2));
  const total = sousTotal + frais + taxes;

  const confirmer = async () => {
    if (!token) return Alert.alert("Connexion requise", "Connecte-toi avant de confirmer.", [{ text: "Se connecter", onPress: () => router.push("/login") }]);
    if (!restaurant || lignes.length === 0) return Alert.alert("Panier vide");
    if (adresse.trim().length < 8) return Alert.alert("Adresse requise", "Entre une adresse de livraison complète.");
    if (methode === "carte") {
      const carte = numero.replace(/\s/g, "");
      if (titulaire.trim().length < 3 || !/^\d{16}$/.test(carte) || !/^\d{2}\/\d{2}$/.test(expiration) || !/^\d{3,4}$/.test(cvv)) {
        return Alert.alert("Carte invalide", "Vérifie le nom, les 16 chiffres, la date MM/AA et le CVV.");
      }
    }

    try {
      setChargement(true);
      const resultat = await api.creerCommande(token, {
        restaurantId: restaurant._id,
        plats: lignes.map((x) => ({ platId: x.plat._id, quantite: x.quantite })),
        adresseLivraison: adresse,
        methodePaiement: methode,
        paiement: methode === "carte" ? { titulaire, numero, expiration, cvv } : undefined,
      });
      vider();
      router.replace({ pathname: "/suivi", params: { id: resultat.commande._id } });
    } catch (erreur) {
      Alert.alert("Commande impossible", erreur instanceof Error ? erreur.message : "Erreur");
    } finally {
      setChargement(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
        <Entete titre="Paiement" retour />
        <Text style={styles.section}>Adresse de livraison</Text>
        <TextInput value={adresse} onChangeText={setAdresse} placeholder="123 rue Exemple, Montréal" style={styles.champ} />

        <Text style={styles.section}>Mode de paiement</Text>
        {[["carte", "Carte bancaire"], ["livraison", "Paiement à la livraison"]].map(([valeur, label]) => (
          <Pressable key={valeur} onPress={() => setMethode(valeur as "carte" | "livraison")} style={[styles.option, methode === valeur && styles.active]}>
            <Text style={{ fontWeight: "800" }}>{label}</Text>
            <View style={[styles.radio, methode === valeur && styles.radioActive]} />
          </Pressable>
        ))}

        {methode === "carte" && (
          <View style={styles.carteBloc}>
            <TextInput value={titulaire} onChangeText={setTitulaire} placeholder="Nom sur la carte" autoCapitalize="words" style={styles.champ} />
            <TextInput value={numero} onChangeText={(v) => setNumero(v.replace(/[^0-9 ]/g, "").slice(0, 19))} placeholder="4242 4242 4242 4242" keyboardType="number-pad" style={styles.champ} />
            <View style={styles.deuxColonnes}>
              <TextInput value={expiration} onChangeText={(v) => setExpiration(v.replace(/[^0-9/]/g, "").slice(0, 5))} placeholder="MM/AA" keyboardType="number-pad" style={[styles.champ, styles.demi]} />
              <TextInput value={cvv} onChangeText={(v) => setCvv(v.replace(/\D/g, "").slice(0, 4))} placeholder="CVV" keyboardType="number-pad" secureTextEntry style={[styles.champ, styles.demi]} />
            </View>
          </View>
        )}

        <View style={styles.resume}>
          <Ligne label="Sous-total" valeur={sousTotal} />
          <Ligne label="Livraison" valeur={frais} />
          <Ligne label="Taxes" valeur={taxes} />
          <View style={styles.separateur} />
          <Ligne label="Total" valeur={total} fort />
        </View>
        <BoutonPrincipal titre={chargement ? "Traitement..." : `Payer et commander · ${total.toFixed(2)} $`} onPress={confirmer} style={{ marginTop: 24 }} />
        <Text style={styles.note}>Paiement simulé pour le projet scolaire. N’utilise pas une vraie carte.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Ligne({ label, valeur, fort = false }: { label: string; valeur: number; fort?: boolean }) {
  return <View style={styles.ligne}><Text style={fort && styles.fort}>{label}</Text><Text style={fort && styles.fort}>{valeur.toFixed(2)} $</Text></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.fond }, page: { padding: 20, paddingBottom: 40 }, section: { fontSize: 19, fontWeight: "900", marginTop: 22, marginBottom: 10 },
  champ: { backgroundColor: palette.blanc, borderWidth: 1, borderColor: palette.bordure, borderRadius: 16, padding: 15, fontSize: 16, marginBottom: 10 },
  option: { backgroundColor: palette.blanc, borderWidth: 1, borderColor: palette.bordure, borderRadius: 16, padding: 16, marginBottom: 10, flexDirection: "row", justifyContent: "space-between" }, active: { borderColor: palette.orange },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: palette.bordure }, radioActive: { borderColor: palette.orange, backgroundColor: palette.orange },
  carteBloc: { marginTop: 8 }, deuxColonnes: { flexDirection: "row", gap: 10 }, demi: { flex: 1 }, resume: { backgroundColor: palette.blanc, borderRadius: 18, padding: 18, marginTop: 22 },
  ligne: { flexDirection: "row", justifyContent: "space-between", marginVertical: 6 }, separateur: { height: 1, backgroundColor: palette.bordure, marginVertical: 8 }, fort: { fontSize: 18, fontWeight: "900" }, note: { textAlign: "center", color: palette.texteDoux, marginTop: 14 },
});
