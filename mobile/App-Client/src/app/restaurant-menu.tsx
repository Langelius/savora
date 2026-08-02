import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useLocalSearchParams } from "expo-router";

import { Entete } from "../components/Entete";
import { FormulairePlat } from "../components/FormulairePlat";
import { useAuth } from "../context/AuthContext";
import { api, Plat, PlatModifiable, Restaurant } from "../services/api";
import { palette } from "../constants/design";

// Écran unique de gestion du menu, utilisé par deux rôles :
//   - le gestionnaire de restaurant, sur son propre établissement ;
//   - l'administrateur, sur n'importe quel établissement (paramètre restaurantId).
// Le serveur applique le cloisonnement ; l'écran ne fait qu'adapter les appels.
export default function RestaurantMenu() {
  const { restaurantId } = useLocalSearchParams<{ restaurantId?: string }>();
  const { token, utilisateur } = useAuth();

  const modeAdmin = utilisateur?.role === "admin" && Boolean(restaurantId);

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [plats, setPlats] = useState<Plat[]>([]);
  const [chargement, setChargement] = useState(true);
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [platEnEdition, setPlatEnEdition] = useState<Plat | null>(null);
  const [enregistrement, setEnregistrement] = useState(false);

  const charger = useCallback(async () => {
    if (!token) return;

    try {
      setChargement(true);
      const resultat = modeAdmin
        ? await api.platsRestaurantAdmin(token, restaurantId!)
        : await api.monRestaurant(token);

      setRestaurant(resultat.restaurant);
      setPlats(resultat.plats);
    } catch (erreur) {
      Alert.alert("Chargement impossible", erreur instanceof Error ? erreur.message : "Erreur");
    } finally {
      setChargement(false);
    }
  }, [token, modeAdmin, restaurantId]);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger])
  );

  const ouvrirCreation = () => {
    setPlatEnEdition(null);
    setFormulaireOuvert(true);
  };

  const ouvrirEdition = (plat: Plat) => {
    setPlatEnEdition(plat);
    setFormulaireOuvert(true);
  };

  const enregistrer = async (champs: PlatModifiable) => {
    if (!token) return;

    try {
      setEnregistrement(true);

      if (platEnEdition) {
        if (modeAdmin) await api.modifierPlatAdmin(token, platEnEdition._id, champs);
        else await api.modifierMonPlat(token, platEnEdition._id, champs);
      } else if (modeAdmin) {
        await api.creerPlatAdmin(token, restaurantId!, champs);
      } else {
        await api.creerMonPlat(token, champs);
      }

      setFormulaireOuvert(false);
      setPlatEnEdition(null);
      await charger();
    } catch (erreur) {
      Alert.alert(
        "Enregistrement impossible",
        erreur instanceof Error ? erreur.message : "Erreur"
      );
    } finally {
      setEnregistrement(false);
    }
  };

  const basculerDisponibilite = async (plat: Plat) => {
    if (!token) return;

    try {
      const champs = { disponible: !(plat as Plat & { disponible?: boolean }).disponible };
      if (modeAdmin) await api.modifierPlatAdmin(token, plat._id, champs);
      else await api.modifierMonPlat(token, plat._id, champs);
      await charger();
    } catch (erreur) {
      Alert.alert("Modification impossible", erreur instanceof Error ? erreur.message : "Erreur");
    }
  };

  const retirer = (plat: Plat) => {
    Alert.alert(
      "Retirer du menu",
      `« ${plat.nom} » ne sera plus proposé aux clients. Les commandes passées le conservent.`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Retirer",
          style: "destructive",
          onPress: async () => {
            if (!token) return;
            try {
              if (modeAdmin) await api.retirerPlatAdmin(token, plat._id);
              else await api.retirerMonPlat(token, plat._id);
              await charger();
            } catch (erreur) {
              Alert.alert(
                "Suppression impossible",
                erreur instanceof Error ? erreur.message : "Erreur"
              );
            }
          },
        },
      ]
    );
  };

  if (chargement && !restaurant) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator size="large" style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.page}>
        <Entete titre="Gestion du menu" retour />

        <Text style={styles.restaurant}>{restaurant?.nom}</Text>
        <Text style={styles.doux}>
          {plats.length} plat{plats.length > 1 ? "s" : ""} au menu
        </Text>

        <Pressable onPress={ouvrirCreation} style={styles.boutonAjout}>
          <Text style={styles.boutonAjoutTexte}>+  Ajouter un plat</Text>
        </Pressable>

        <FlatList
          data={plats}
          keyExtractor={(plat) => plat._id}
          contentContainerStyle={{ paddingBottom: 30 }}
          ListEmptyComponent={
            <Text style={styles.vide}>
              Aucun plat pour le moment. Ajoute le premier avec le bouton ci-dessus.
            </Text>
          }
          renderItem={({ item }) => {
            const disponible = (item as Plat & { disponible?: boolean }).disponible !== false;

            return (
              <View style={[styles.carte, !disponible && styles.carteRetiree]}>
                <Image source={{ uri: item.image }} style={styles.image} />

                <View style={{ flex: 1 }}>
                  <Text style={styles.nom}>{item.nom}</Text>
                  <Text style={styles.doux} numberOfLines={1}>
                    {item.categorie} · {item.prix.toFixed(2)} $
                  </Text>

                  {item.options && item.options.length > 0 && (
                    <Text style={styles.options}>
                      {item.options.length} option{item.options.length > 1 ? "s" : ""}
                    </Text>
                  )}

                  {!disponible && <Text style={styles.retire}>Retiré du menu</Text>}

                  <View style={styles.actions}>
                    <Pressable onPress={() => ouvrirEdition(item)}>
                      <Text style={styles.action}>Modifier</Text>
                    </Pressable>
                    <Pressable onPress={() => basculerDisponibilite(item)}>
                      <Text style={styles.action}>
                        {disponible ? "Rendre indisponible" : "Remettre au menu"}
                      </Text>
                    </Pressable>
                    {disponible && (
                      <Pressable onPress={() => retirer(item)}>
                        <Text style={styles.actionDanger}>Retirer</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              </View>
            );
          }}
        />
      </View>

      {formulaireOuvert && (
        <FormulairePlat
          // La clé force la réinitialisation du formulaire entre deux plats.
          key={platEnEdition?._id ?? "nouveau"}
          visible={formulaireOuvert}
          plat={platEnEdition}
          enregistrement={enregistrement}
          onFermer={() => {
            setFormulaireOuvert(false);
            setPlatEnEdition(null);
          }}
          onEnregistrer={enregistrer}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.fond },
  page: { flex: 1, padding: 20 },
  restaurant: { fontSize: 26, fontWeight: "900", marginTop: 14 },
  doux: { color: palette.texteDoux, marginTop: 4 },
  boutonAjout: {
    backgroundColor: palette.orange,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
    marginVertical: 18,
  },
  boutonAjoutTexte: { color: palette.blanc, fontWeight: "900", fontSize: 16 },
  vide: { color: palette.texteDoux, textAlign: "center", marginTop: 40, lineHeight: 21 },
  carte: {
    backgroundColor: palette.blanc,
    borderRadius: 18,
    padding: 12,
    marginBottom: 12,
    flexDirection: "row",
    borderWidth: 1,
    borderColor: palette.bordure,
  },
  carteRetiree: { opacity: 0.55 },
  image: { width: 78, height: 78, borderRadius: 14, marginRight: 12 },
  nom: { fontSize: 16, fontWeight: "900" },
  options: { color: palette.orangeFonce, fontSize: 12, fontWeight: "800", marginTop: 3 },
  retire: { color: palette.danger, fontSize: 12, fontWeight: "800", marginTop: 3 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 14, marginTop: 10 },
  action: { color: palette.orangeFonce, fontWeight: "800", fontSize: 13 },
  actionDanger: { color: palette.danger, fontWeight: "800", fontSize: 13 },
});
