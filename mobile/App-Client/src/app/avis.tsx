import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { Entete } from "../components/Entete";
import { BoutonPrincipal } from "../components/BoutonPrincipal";
import { useAuth } from "../context/AuthContext";
import { api, Avis as AvisType } from "../services/api";
import { palette } from "../constants/design";

const ETOILES = [1, 2, 3, 4, 5];

export default function Avis() {
  const router = useRouter();
  const { id, restaurant } = useLocalSearchParams<{ id?: string; restaurant?: string }>();
  const { token } = useAuth();

  const [note, setNote] = useState(0);
  const [commentaire, setCommentaire] = useState("");
  const [chargement, setChargement] = useState(true);
  const [envoi, setEnvoi] = useState(false);
  const [avisExistant, setAvisExistant] = useState<AvisType | null>(null);

  // Une commande ne peut être notée qu'une fois : on vérifie d'abord si
  // un avis existe déjà, pour l'afficher en lecture seule.
  useEffect(() => {
    if (!id || !token) {
      setChargement(false);
      return;
    }

    api
      .avisCommande(token, id)
      .then((resultat) => {
        if (resultat.avis) {
          setAvisExistant(resultat.avis);
          setNote(resultat.avis.note);
          setCommentaire(resultat.avis.commentaire);
        }
      })
      .catch(() => {
        // Absence d'avis : on laisse simplement le formulaire vierge.
      })
      .finally(() => setChargement(false));
  }, [id, token]);

  const envoyer = async () => {
    if (!id || !token) return;

    if (note < 1) {
      Alert.alert("Note manquante", "Choisis une note de 1 à 5 étoiles.");
      return;
    }

    try {
      setEnvoi(true);
      const resultat = await api.deposerAvis(token, id, note, commentaire.trim());

      Alert.alert(
        "Merci !",
        `Ton avis est enregistré. La note du restaurant est maintenant de ${resultat.restaurant.note.toFixed(
          1
        )} sur ${resultat.restaurant.nombreAvis} avis.`,
        [{ text: "Fermer", onPress: () => router.back() }]
      );
    } catch (erreur) {
      Alert.alert(
        "Notation impossible",
        erreur instanceof Error ? erreur.message : "Erreur inconnue"
      );
    } finally {
      setEnvoi(false);
    }
  };

  if (chargement) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator size="large" style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  const lectureSeule = avisExistant !== null;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
        <Entete titre="Noter la commande" retour />

        <Text style={styles.restaurant}>{restaurant ?? "Ton restaurant"}</Text>
        <Text style={styles.doux}>
          {lectureSeule
            ? "Tu as déjà noté cette commande. Merci pour ton retour."
            : "Comment s'est passée cette commande ?"}
        </Text>

        <View style={styles.etoiles}>
          {ETOILES.map((valeur) => (
            <Pressable
              key={valeur}
              disabled={lectureSeule}
              onPress={() => setNote(valeur)}
              hitSlop={8}
            >
              <Text style={[styles.etoile, valeur <= note && styles.etoilePleine]}>★</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.libelle}>
          {note === 0 ? "Aucune note" : `${note} étoile${note > 1 ? "s" : ""} sur 5`}
        </Text>

        <Text style={styles.section}>Commentaire (facultatif)</Text>
        <TextInput
          value={commentaire}
          onChangeText={setCommentaire}
          editable={!lectureSeule}
          placeholder="Qualité, température, ponctualité..."
          multiline
          maxLength={600}
          style={styles.champ}
        />
        {!lectureSeule && (
          <Text style={styles.compteur}>{commentaire.length} / 600</Text>
        )}

        {!lectureSeule && (
          <BoutonPrincipal
            titre={envoi ? "Envoi..." : "Envoyer mon avis"}
            onPress={envoyer}
            desactive={envoi || note < 1}
            style={{ marginTop: 24 }}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.fond },
  page: { padding: 20, paddingBottom: 40 },
  restaurant: { fontSize: 26, fontWeight: "900", marginTop: 18, color: palette.texte },
  doux: { color: palette.texteDoux, marginTop: 8, lineHeight: 21 },
  etoiles: { flexDirection: "row", gap: 10, marginTop: 26, justifyContent: "center" },
  etoile: { fontSize: 44, color: palette.bordure },
  etoilePleine: { color: palette.or },
  libelle: { textAlign: "center", marginTop: 10, fontWeight: "800", color: palette.texte },
  section: { fontSize: 18, fontWeight: "900", marginTop: 30, marginBottom: 10 },
  champ: {
    backgroundColor: palette.blanc,
    borderWidth: 1,
    borderColor: palette.bordure,
    borderRadius: 16,
    padding: 15,
    fontSize: 16,
    minHeight: 110,
    textAlignVertical: "top",
  },
  compteur: { textAlign: "right", color: palette.texteDoux, marginTop: 6, fontSize: 12 },
});
