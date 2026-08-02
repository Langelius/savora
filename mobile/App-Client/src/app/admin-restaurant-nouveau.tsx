import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";

import { Entete } from "../components/Entete";
import { BoutonPrincipal } from "../components/BoutonPrincipal";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { palette } from "../constants/design";

// Création d'un établissement par l'administration.
//
// Un restaurant, c'est deux choses : la fiche visible par les clients, et le
// compte du gestionnaire qui fera évoluer les statuts. Les deux sont créés
// ici, ce qui supprime le passage obligé par la ligne de commande.
export default function AdminRestaurantNouveau() {
  const router = useRouter();
  const { token } = useAuth();

  const [nom, setNom] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [adresse, setAdresse] = useState("");
  const [delai, setDelai] = useState("25–35 min");
  const [frais, setFrais] = useState("2.99");

  const [creerGestionnaire, setCreerGestionnaire] = useState(true);
  const [nomGestionnaire, setNomGestionnaire] = useState("");
  const [courriel, setCourriel] = useState("");
  const [motDePasse, setMotDePasse] = useState("");

  const [envoi, setEnvoi] = useState(false);

  const soumettre = async () => {
    if (!token) return;

    const montantFrais = Number(frais.replace(",", "."));

    if (nom.trim().length < 2) return Alert.alert("Nom requis", "Le nom du restaurant est trop court.");
    if (cuisine.trim().length < 2) return Alert.alert("Cuisine requise", "Indique le type de cuisine.");
    if (!/^https?:\/\//i.test(image.trim())) {
      return Alert.alert("Image requise", "L'image doit être une URL commençant par http ou https.");
    }
    if (!Number.isFinite(montantFrais) || montantFrais < 0) {
      return Alert.alert("Frais invalides", "Les frais de livraison doivent être un nombre positif.");
    }

    if (creerGestionnaire) {
      if (!/^\S+@\S+\.\S+$/.test(courriel.trim())) {
        return Alert.alert("Courriel invalide", "Vérifie l'adresse du gestionnaire.");
      }
      if (motDePasse.length < 8) {
        return Alert.alert("Mot de passe trop court", "Au moins 8 caractères.");
      }
    }

    try {
      setEnvoi(true);

      const resultat = await api.creerRestaurantAdmin(token, {
        nom: nom.trim(),
        cuisine: cuisine.trim(),
        description: description.trim(),
        image: image.trim(),
        adresse: adresse.trim(),
        delai: delai.trim(),
        fraisLivraison: montantFrais,
        ...(creerGestionnaire
          ? {
              gestionnaire: {
                nom: nomGestionnaire.trim() || undefined,
                courriel: courriel.trim(),
                motDePasse,
              },
            }
          : {}),
      });

      Alert.alert(
        "Restaurant créé",
        resultat.gestionnaire
          ? `${resultat.restaurant.nom} est créé. Le gestionnaire ${resultat.gestionnaire.courriel} peut se connecter et ajouter les plats.`
          : `${resultat.restaurant.nom} est créé. Ajoute maintenant ses plats.`,
        [
          {
            text: "Ajouter les plats",
            onPress: () =>
              router.replace(
                `/restaurant-menu?restaurantId=${resultat.restaurant._id}` as never
              ),
          },
        ]
      );
    } catch (erreur) {
      Alert.alert("Création impossible", erreur instanceof Error ? erreur.message : "Erreur");
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
          <Entete titre="Nouveau restaurant" retour />

          <Text style={styles.section}>L'établissement</Text>

          <Champ libelle="Nom" valeur={nom} onChange={setNom} placeholder="Trattoria Bella" />
          <Champ
            libelle="Type de cuisine"
            valeur={cuisine}
            onChange={setCuisine}
            placeholder="Cuisine italienne"
          />
          <Champ
            libelle="Description"
            valeur={description}
            onChange={setDescription}
            placeholder="Une table italienne moderne."
            multiligne
          />
          <Champ
            libelle="Image (URL)"
            valeur={image}
            onChange={setImage}
            placeholder="https://images.unsplash.com/..."
          />
          <Champ
            libelle="Adresse"
            valeur={adresse}
            onChange={setAdresse}
            placeholder="1420 rue Sainte-Catherine Ouest, Montréal"
          />
          <Champ libelle="Délai annoncé" valeur={delai} onChange={setDelai} />
          <Champ
            libelle="Frais de livraison ($)"
            valeur={frais}
            onChange={setFrais}
            clavier="decimal-pad"
          />

          <View style={styles.bascule}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.section}>Compte gestionnaire</Text>
              <Text style={styles.aide}>
                Sans gestionnaire, personne ne pourra faire évoluer les commandes de ce
                restaurant.
              </Text>
            </View>
            <Switch
              value={creerGestionnaire}
              onValueChange={setCreerGestionnaire}
              trackColor={{ true: palette.orange }}
            />
          </View>

          {creerGestionnaire && (
            <>
              <Champ
                libelle="Nom du gestionnaire"
                valeur={nomGestionnaire}
                onChange={setNomGestionnaire}
                placeholder="Optionnel"
              />
              <Champ
                libelle="Courriel"
                valeur={courriel}
                onChange={setCourriel}
                placeholder="gestion@trattoria.ca"
                clavier="email"
              />
              <Champ
                libelle="Mot de passe"
                valeur={motDePasse}
                onChange={setMotDePasse}
                placeholder="8 caractères minimum"
                masque
              />
              <Text style={styles.aide}>
                Si ce courriel correspond déjà à un compte, celui-ci est promu gestionnaire
                de ce restaurant.
              </Text>
            </>
          )}

          <BoutonPrincipal
            titre={envoi ? "Création..." : "Créer le restaurant"}
            onPress={soumettre}
            desactive={envoi}
            style={{ marginTop: 26 }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Champ({
  libelle,
  valeur,
  onChange,
  placeholder,
  clavier,
  multiligne = false,
  masque = false,
}: {
  libelle: string;
  valeur: string;
  onChange: (v: string) => void;
  placeholder?: string;
  clavier?: "decimal-pad" | "email";
  multiligne?: boolean;
  masque?: boolean;
}) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.libelle}>{libelle}</Text>
      <TextInput
        value={valeur}
        onChangeText={onChange}
        placeholder={placeholder}
        secureTextEntry={masque}
        multiline={multiligne}
        keyboardType={clavier === "decimal-pad" ? "decimal-pad" : clavier === "email" ? "email-address" : "default"}
        autoCapitalize={clavier === "email" ? "none" : "sentences"}
        autoCorrect={clavier !== "email"}
        style={[styles.champ, multiligne && styles.multiligne]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.fond },
  page: { padding: 20, paddingBottom: 50 },
  section: { fontSize: 19, fontWeight: "900", marginTop: 18, marginBottom: 12 },
  libelle: { fontWeight: "800", marginBottom: 6, fontSize: 14 },
  champ: {
    backgroundColor: palette.blanc,
    borderWidth: 1,
    borderColor: palette.bordure,
    borderRadius: 14,
    padding: 13,
    fontSize: 15,
  },
  multiligne: { minHeight: 78, textAlignVertical: "top" },
  bascule: { flexDirection: "row", alignItems: "center", marginTop: 14 },
  aide: { color: palette.texteDoux, fontSize: 12, lineHeight: 17, marginBottom: 8 },
});
