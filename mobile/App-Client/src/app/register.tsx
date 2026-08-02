import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";

import { BoutonPrincipal } from "../components/BoutonPrincipal";
import { palette } from "../constants/design";
import { useAuth } from "../context/AuthContext";

const LONGUEUR_MOT_DE_PASSE = 8;

export default function Register() {
  const router = useRouter();
  const { inscription } = useAuth();

  const [nom, setNom] = useState("");
  const [courriel, setCourriel] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [chargement, setChargement] = useState(false);

  const soumettre = async () => {
    if (nom.trim().length < 2) {
      return Alert.alert("Nom trop court", "Entre ton nom complet.");
    }
    if (!/^\S+@\S+\.\S+$/.test(courriel.trim())) {
      return Alert.alert("Courriel invalide", "Vérifie l'adresse saisie.");
    }
    if (motDePasse.length < LONGUEUR_MOT_DE_PASSE) {
      return Alert.alert(
        "Mot de passe trop court",
        `Il doit contenir au moins ${LONGUEUR_MOT_DE_PASSE} caractères.`
      );
    }

    try {
      setChargement(true);
      await inscription(nom.trim(), courriel.trim(), motDePasse);
      router.replace("/restaurants");
    } catch (erreur) {
      Alert.alert(
        "Inscription impossible",
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

        <Text style={styles.titre}>Créer ton compte</Text>
        <Text style={styles.sousTitre}>Quelques secondes suffisent pour commencer.</Text>

        <Text style={styles.label}>Nom complet</Text>
        <TextInput value={nom} onChangeText={setNom} style={styles.champ} />

        <Text style={styles.label}>Courriel</Text>
        <TextInput
          value={courriel}
          onChangeText={setCourriel}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          style={styles.champ}
        />

        <Text style={styles.label}>Mot de passe</Text>
        <TextInput
          value={motDePasse}
          onChangeText={setMotDePasse}
          secureTextEntry
          style={styles.champ}
        />
        <Text style={styles.aide}>Au moins {LONGUEUR_MOT_DE_PASSE} caractères.</Text>

        <BoutonPrincipal
          titre={chargement ? "Création..." : "Créer mon compte"}
          onPress={soumettre}
          desactive={chargement}
          style={{ marginTop: 24 }}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.fond },
  page: { flex: 1, padding: 24, justifyContent: "center" },
  retour: { fontSize: 38, position: "absolute", top: 20 },
  titre: { fontSize: 34, fontWeight: "900" },
  sousTitre: { color: palette.texteDoux, fontSize: 16, marginTop: 8, marginBottom: 22 },
  label: { fontWeight: "800", marginBottom: 8, marginTop: 14 },
  champ: {
    backgroundColor: palette.blanc,
    borderWidth: 1,
    borderColor: palette.bordure,
    borderRadius: 16,
    padding: 15,
    fontSize: 16,
  },
  aide: { color: palette.texteDoux, fontSize: 13, marginTop: 6 },
});
