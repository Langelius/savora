import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { io, Socket } from "socket.io-client";
import { Entete } from "../components/Entete";
import { api, MessageDiscussion } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { palette } from "../constants/design";
import { SOCKET_URL } from "../constants/config";

export default function Discussion() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { token, utilisateur } = useAuth();
  const [messages, setMessages] = useState<MessageDiscussion[]>([]);
  const [texte, setTexte] = useState("");
  const [chargement, setChargement] = useState(true);
  const [envoi, setEnvoi] = useState(false);
  const liste = useRef<FlatList<MessageDiscussion>>(null);

  useEffect(() => {
    if (!id || !token) { setChargement(false); return; }
    api.messagesCommande(token, id)
      .then((r) => setMessages(r.messages))
      .catch((e) => Alert.alert("Discussion", e instanceof Error ? e.message : "Erreur"))
      .finally(() => setChargement(false));

    const socket: Socket = io(SOCKET_URL, { auth: { token }, transports: ["websocket", "polling"] });
    socket.emit("commande:rejoindre", id);
    const nouveau = (message: MessageDiscussion) => {
      setMessages((actuels) => actuels.some((m) => m._id === message._id) ? actuels : [...actuels, message]);
    };
    socket.on("discussion:nouveau-message", nouveau);
    return () => {
      socket.emit("commande:quitter", id);
      socket.off("discussion:nouveau-message", nouveau);
      socket.disconnect();
    };
  }, [id, token]);

  useEffect(() => {
    if (messages.length) setTimeout(() => liste.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  const envoyer = async () => {
    const contenu = texte.trim();
    if (!id || !token || !contenu || envoi) return;
    try {
      setEnvoi(true);
      setTexte("");
      const resultat = await api.envoyerMessageCommande(token, id, contenu);
      setMessages((actuels) => actuels.some((m) => m._id === resultat.message._id) ? actuels : [...actuels, resultat.message]);
    } catch (e) {
      setTexte(contenu);
      Alert.alert("Envoi impossible", e instanceof Error ? e.message : "Erreur");
    } finally {
      setEnvoi(false);
    }
  };

  if (chargement) return <SafeAreaView style={styles.safe}><ActivityIndicator size="large" style={{ flex: 1 }} /></SafeAreaView>;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.page}>
          <Entete titre="Discussion" retour />
          <Text style={styles.info}>Échange avec le restaurant et le livreur de cette commande.</Text>
          <FlatList
            ref={liste}
            data={messages}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.liste}
            ListEmptyComponent={<Text style={styles.vide}>Aucun message pour le moment.</Text>}
            renderItem={({ item }) => {
              const moi = item.auteurId?._id === utilisateur?.id;
              return (
                <View style={[styles.message, moi ? styles.messageMoi : styles.messageAutre]}>
                  {!moi && <Text style={styles.auteur}>{item.auteurId?.nom} · {item.auteurId?.role}</Text>}
                  <Text style={styles.texte}>{item.texte}</Text>
                  <Text style={styles.heure}>{new Date(item.createdAt).toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" })}</Text>
                </View>
              );
            }}
          />
          <View style={styles.saisie}>
            <TextInput value={texte} onChangeText={setTexte} placeholder="Écrire un message..." multiline maxLength={1000} style={styles.champ} />
            <Pressable onPress={envoyer} disabled={!texte.trim() || envoi} style={[styles.envoyer, (!texte.trim() || envoi) && styles.desactive]}>
              <Text style={styles.envoyerTexte}>{envoi ? "..." : "Envoyer"}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.fond }, flex: { flex: 1 }, page: { flex: 1, padding: 20 }, info: { color: palette.texteDoux, marginTop: 8 },
  liste: { paddingVertical: 16, flexGrow: 1 }, vide: { textAlign: "center", marginTop: 80, color: palette.texteDoux },
  message: { maxWidth: "82%", borderRadius: 18, padding: 12, marginBottom: 10 }, messageMoi: { alignSelf: "flex-end", backgroundColor: "#FFE0C2" }, messageAutre: { alignSelf: "flex-start", backgroundColor: palette.blanc, borderWidth: 1, borderColor: palette.bordure },
  auteur: { fontSize: 12, fontWeight: "900", marginBottom: 4 }, texte: { fontSize: 16 }, heure: { fontSize: 10, color: palette.texteDoux, textAlign: "right", marginTop: 5 },
  saisie: { flexDirection: "row", alignItems: "flex-end", gap: 10, paddingTop: 10 }, champ: { flex: 1, maxHeight: 110, backgroundColor: palette.blanc, borderWidth: 1, borderColor: palette.bordure, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 11 },
  envoyer: { backgroundColor: palette.orange, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 13 }, desactive: { opacity: 0.5 }, envoyerTexte: { color: "white", fontWeight: "900" },
});
