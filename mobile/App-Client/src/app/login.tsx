import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { BoutonPrincipal } from "../components/BoutonPrincipal";
import { palette } from "../constants/design";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const router = useRouter();
  const { connexion } = useAuth();
  const [courriel, setCourriel] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [chargement, setChargement] = useState(false);

  const soumettre = async () => {
    if (!courriel.trim() || !motDePasse) {
      Alert.alert("Champs requis", "Entre ton courriel et ton mot de passe.");
      return;
    }

    try {
      setChargement(true);
      const utilisateur = await connexion(courriel.trim(), motDePasse);

      if (utilisateur.role === "admin") {
        router.replace("/admin-dashboard");
        return;
      }

      if (utilisateur.role === "restaurant") {
        router.replace("/restaurant-dashboard");
        return;
      }

      if (utilisateur.role === "livreur") {
        router.replace("/livreur-dashboard");
        return;
      }

      router.replace("/restaurants");
    } catch (erreur) {
      Alert.alert(
        "Connexion impossible",
        erreur instanceof Error ? erreur.message : "Erreur inconnue"
      );
    } finally {
      setChargement(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.page}
      >
        <Pressable onPress={() => router.back()}>
          <Text style={styles.retour}>‹</Text>
        </Pressable>

        <Text style={styles.logo}>SAVORA.</Text>
        <Text style={styles.titre}>Heureuse de te revoir.</Text>
        <Text style={styles.sousTitre}>
          Connecte-toi pour accéder à ton espace Savora.
        </Text>

        <Text style={styles.label}>Adresse courriel</Text>
        <TextInput
          value={courriel}
          onChangeText={setCourriel}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          placeholder="nom@exemple.com"
          style={styles.champ}
        />

        <Text style={styles.label}>Mot de passe</Text>
        <TextInput
          value={motDePasse}
          onChangeText={setMotDePasse}
          secureTextEntry
          placeholder="••••••••"
          style={styles.champ}
          onSubmitEditing={soumettre}
        />

        <BoutonPrincipal
          titre={chargement ? "Connexion..." : "Se connecter"}
          onPress={soumettre}
          style={{ marginTop: 24 }}
        />

        <View style={styles.bas}>
          <Text>Pas encore de compte ? </Text>
          <Pressable onPress={() => router.push("/register")}>
            <Text style={styles.lien}>Créer un compte</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.fond },
  page: { flex: 1, padding: 24, justifyContent: "center" },
  retour: { fontSize: 38, color: palette.texte, position: "absolute", top: 20 },
  logo: { fontWeight: "900", letterSpacing: 4, fontSize: 18, marginBottom: 28 },
  titre: { fontSize: 34, fontWeight: "900", color: palette.texte },
  sousTitre: { color: palette.texteDoux, fontSize: 16, lineHeight: 23, marginTop: 10, marginBottom: 24 },
  label: { fontWeight: "800", marginBottom: 8, marginTop: 14 },
  champ: { backgroundColor: palette.blanc, borderWidth: 1, borderColor: palette.bordure, borderRadius: 16, padding: 15, fontSize: 16 },
  bas: { flexDirection: "row", justifyContent: "center", marginTop: 24 },
  lien: { color: palette.orangeFonce, fontWeight: "800" },
});
