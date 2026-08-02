import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { Entete } from "../components/Entete";
import { BoutonPrincipal } from "../components/BoutonPrincipal";
import { usePanier } from "../context/PanierContext";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { palette } from "../constants/design";
import { TAUX_TAXES_PAR_DEFAUT } from "../constants/config";

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

  // Le taux de taxes vient du serveur : il n'est plus recopié dans l'écran.
  const [tauxTaxes, setTauxTaxes] = useState(TAUX_TAXES_PAR_DEFAUT);
  const [modePaiement, setModePaiement] = useState<"stripe" | "simulation">("simulation");

  useEffect(() => {
    api
      .configuration()
      .then((configuration) => {
        setTauxTaxes(configuration.tauxTaxes);
        setModePaiement(configuration.modePaiement);
      })
      .catch(() => {
        // Serveur injoignable : on garde la valeur de repli pour l'affichage.
        // Le montant réellement facturé reste celui calculé par l'API.
      });
  }, []);

  const frais = restaurant?.fraisLivraison ?? 0;
  const taxes = Math.round(sousTotal * tauxTaxes * 100) / 100;
  const total = Math.round((sousTotal + frais + taxes) * 100) / 100;

  const confirmer = async () => {
    if (!token) {
      return Alert.alert("Connexion requise", "Connecte-toi avant de confirmer.", [
        { text: "Se connecter", onPress: () => router.push("/login") },
      ]);
    }

    if (!restaurant || lignes.length === 0) return Alert.alert("Panier vide");

    if (adresse.trim().length < 8) {
      return Alert.alert("Adresse requise", "Entre une adresse de livraison complète.");
    }

    if (methode === "carte") {
      // Un message par champ : « carte invalide » ne dit pas quoi corriger.
      const probleme = validerCarte({ titulaire, numero, expiration, cvv });
      if (probleme) return Alert.alert("Carte invalide", probleme);
    }

    try {
      setChargement(true);

      const resultat = await api.creerCommande(token, {
        restaurantId: restaurant._id,
        plats: lignes.map((ligne) => ({
          platId: ligne.plat._id,
          quantite: ligne.quantite,
          options: ligne.options,
        })),
        adresseLivraison: adresse,
        methodePaiement: methode,
        paiement: methode === "carte" ? { titulaire, numero, expiration, cvv } : undefined,
      });

      vider();
      router.replace({ pathname: "/suivi", params: { id: resultat.commande._id } });
    } catch (erreur) {
      Alert.alert(
        "Commande impossible",
        erreur instanceof Error ? erreur.message : "Erreur"
      );
    } finally {
      setChargement(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
        <Entete titre="Paiement" retour />

        <Text style={styles.section}>Adresse de livraison</Text>
        <TextInput
          value={adresse}
          onChangeText={setAdresse}
          placeholder="123 rue Exemple, Montréal"
          style={styles.champ}
        />

        <Text style={styles.section}>Mode de paiement</Text>
        {(
          [
            ["carte", "Carte bancaire"],
            ["livraison", "Paiement à la livraison"],
          ] as const
        ).map(([valeur, libelle]) => (
          <Pressable
            key={valeur}
            onPress={() => setMethode(valeur)}
            style={[styles.option, methode === valeur && styles.active]}
          >
            <Text style={styles.optionTexte}>{libelle}</Text>
            <View style={[styles.radio, methode === valeur && styles.radioActive]} />
          </Pressable>
        ))}

        {methode === "carte" && (
          <View style={styles.carteBloc}>
            <TextInput
              value={titulaire}
              onChangeText={setTitulaire}
              placeholder="Nom sur la carte"
              autoCapitalize="words"
              style={styles.champ}
            />
            <TextInput
              value={numero}
              onChangeText={(v) => setNumero(formaterNumero(v))}
              placeholder="4242 4242 4242 4242"
              keyboardType="number-pad"
              style={styles.champ}
            />
            <View style={styles.deuxColonnes}>
              <TextInput
                value={expiration}
                onChangeText={(v) => setExpiration(formaterExpiration(v))}
                placeholder="MM/AA"
                keyboardType="number-pad"
                style={[styles.champ, styles.demi]}
              />
              <TextInput
                value={cvv}
                onChangeText={(v) => setCvv(v.replace(/\D/g, "").slice(0, 4))}
                placeholder="CVV"
                keyboardType="number-pad"
                secureTextEntry
                style={[styles.champ, styles.demi]}
              />
            </View>
          </View>
        )}

        <View style={styles.resume}>
          <Ligne libelle="Sous-total" valeur={sousTotal} />
          <Ligne libelle="Livraison" valeur={frais} />
          <Ligne libelle={`Taxes (${(tauxTaxes * 100).toFixed(3)} %)`} valeur={taxes} />
          <View style={styles.separateur} />
          <Ligne libelle="Total" valeur={total} fort />
        </View>

        <BoutonPrincipal
          titre={chargement ? "Traitement..." : `Payer et commander · ${total.toFixed(2)} $`}
          onPress={confirmer}
          desactive={chargement}
          style={{ marginTop: 24 }}
        />

        <Text style={styles.note}>
          {modePaiement === "stripe"
            ? "Paiement traité par Stripe en mode test. Utilise la carte 4242 4242 4242 4242."
            : "Paiement simulé pour le projet scolaire. N'utilise pas une vraie carte."}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// Regroupe les chiffres par quatre : 4242424242424242 → 4242 4242 4242 4242.
function formaterNumero(saisie: string): string {
  const chiffres = saisie.replace(/\D/g, "").slice(0, 16);
  const groupes = chiffres.match(/.{1,4}/g);
  return groupes ? groupes.join(" ") : "";
}

// Insère la barre oblique automatiquement : taper « 0828 » donne « 08/28 ».
// Sans cela, l'utilisateur devait deviner qu'il fallait la saisir lui-même.
function formaterExpiration(saisie: string): string {
  const chiffres = saisie.replace(/\D/g, "").slice(0, 4);
  if (chiffres.length <= 2) return chiffres;
  return `${chiffres.slice(0, 2)}/${chiffres.slice(2)}`;
}

// Renvoie le premier problème rencontré, ou null si la carte est valide.
// Les mêmes règles sont réappliquées par le serveur : ceci évite seulement
// un aller-retour réseau inutile.
function validerCarte(carte: {
  titulaire: string;
  numero: string;
  expiration: string;
  cvv: string;
}): string | null {
  if (carte.titulaire.trim().length < 3) {
    return "Entre le nom inscrit sur la carte (3 caractères minimum).";
  }

  const chiffres = carte.numero.replace(/\D/g, "");
  if (chiffres.length !== 16) {
    return `Le numéro doit contenir 16 chiffres (tu en as saisi ${chiffres.length}).`;
  }

  const dateChiffres = carte.expiration.replace(/\D/g, "");
  if (dateChiffres.length !== 4) {
    return "La date d'expiration doit être au format MM/AA, par exemple 08/28.";
  }

  const mois = Number(dateChiffres.slice(0, 2));
  const annee = Number(dateChiffres.slice(2));
  if (mois < 1 || mois > 12) {
    return `Le mois « ${dateChiffres.slice(0, 2)} » n'existe pas. Format attendu : MM/AA.`;
  }

  // Une carte reste valable jusqu'au dernier jour du mois indiqué.
  const finDeValidite = new Date(2000 + annee, mois, 0, 23, 59, 59);
  if (finDeValidite < new Date()) {
    return "Cette carte est expirée. Utilise une date future, par exemple 12/30.";
  }

  if (!/^\d{3,4}$/.test(carte.cvv.trim())) {
    return "Le CVV doit contenir 3 ou 4 chiffres.";
  }

  return null;
}

function Ligne({
  libelle,
  valeur,
  fort = false,
}: {
  libelle: string;
  valeur: number;
  fort?: boolean;
}) {
  return (
    <View style={styles.ligne}>
      <Text style={fort ? styles.fort : undefined}>{libelle}</Text>
      <Text style={fort ? styles.fort : undefined}>{valeur.toFixed(2)} $</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.fond },
  page: { padding: 20, paddingBottom: 40 },
  section: { fontSize: 19, fontWeight: "900", marginTop: 22, marginBottom: 10 },
  champ: {
    backgroundColor: palette.blanc,
    borderWidth: 1,
    borderColor: palette.bordure,
    borderRadius: 16,
    padding: 15,
    fontSize: 16,
    marginBottom: 10,
  },
  option: {
    backgroundColor: palette.blanc,
    borderWidth: 1,
    borderColor: palette.bordure,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  optionTexte: { fontWeight: "800" },
  active: { borderColor: palette.orange },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: palette.bordure,
  },
  radioActive: { borderColor: palette.orange, backgroundColor: palette.orange },
  carteBloc: { marginTop: 8 },
  deuxColonnes: { flexDirection: "row", gap: 10 },
  demi: { flex: 1 },
  resume: { backgroundColor: palette.blanc, borderRadius: 18, padding: 18, marginTop: 22 },
  ligne: { flexDirection: "row", justifyContent: "space-between", marginVertical: 6 },
  separateur: { height: 1, backgroundColor: palette.bordure, marginVertical: 8 },
  fort: { fontSize: 18, fontWeight: "900" },
  note: { textAlign: "center", color: palette.texteDoux, marginTop: 14, lineHeight: 19 },
});
