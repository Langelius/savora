import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";

import {
  api,
  UtilisateurAdmin,
} from "../services/api";
import { useAuth } from "../context/AuthContext";

const ROLES = [
  "client",
  "restaurant",
  "livreur",
  "admin",
] as const;

export default function AdminUtilisateurs() {
  const router = useRouter();
  const { token, utilisateur } = useAuth();

  const [utilisateurs, setUtilisateurs] = useState<
    UtilisateurAdmin[]
  >([]);
  const [chargement, setChargement] = useState(true);
  const [recherche, setRecherche] = useState("");
  const [roleFiltre, setRoleFiltre] = useState("");

  const chargerUtilisateurs = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      setChargement(true);

      const resultat = await api.utilisateursAdmin(
        token,
        roleFiltre,
        recherche
      );

      setUtilisateurs(resultat.utilisateurs);
    } catch (erreur) {
      Alert.alert(
        "Erreur",
        erreur instanceof Error
          ? erreur.message
          : "Impossible de charger les utilisateurs."
      );
    } finally {
      setChargement(false);
    }
  }, [token, roleFiltre, recherche]);

  useEffect(() => {
    if (utilisateur?.role !== "admin") {
      router.replace("/");
      return;
    }

    chargerUtilisateurs();
  }, [utilisateur, chargerUtilisateurs, router]);

  const changerRole = (
    utilisateurId: string,
    roleActuel: string
  ) => {
    const boutons = ROLES.map((role) => ({
      text:
        role === roleActuel
          ? `${role} ✓`
          : role,
      onPress: async () => {
        if (!token || role === roleActuel) {
          return;
        }

        try {
          await api.modifierRoleUtilisateurAdmin(
            token,
            utilisateurId,
            role
          );

          await chargerUtilisateurs();
        } catch (erreur) {
          Alert.alert(
            "Erreur",
            erreur instanceof Error
              ? erreur.message
              : "Impossible de modifier le rôle."
          );
        }
      },
    }));

    Alert.alert(
      "Modifier le rôle",
      "Choisis le nouveau rôle.",
      [
        ...boutons,
        {
          text: "Annuler",
          style: "cancel",
        },
      ]
    );
  };

  const supprimerUtilisateur = (
    id: string,
    nom: string
  ) => {
    Alert.alert(
      "Supprimer l'utilisateur",
      `Supprimer définitivement ${nom} ?`,
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            if (!token) {
              return;
            }

            try {
              await api.supprimerUtilisateurAdmin(
                token,
                id
              );

              setUtilisateurs((liste) =>
                liste.filter(
                  (element) => element._id !== id
                )
              );
            } catch (erreur) {
              Alert.alert(
                "Erreur",
                erreur instanceof Error
                  ? erreur.message
                  : "Impossible de supprimer cet utilisateur."
              );
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.page}>
        <View style={styles.entete}>
          <Pressable
            onPress={() => router.back()}
            style={styles.retour}
          >
            <Text style={styles.retourTexte}>‹</Text>
          </Pressable>

          <View>
            <Text style={styles.titre}>
              Utilisateurs
            </Text>
            <Text style={styles.sousTitre}>
              Gestion des comptes Savora
            </Text>
          </View>
        </View>

        <TextInput
          value={recherche}
          onChangeText={setRecherche}
          placeholder="Rechercher par nom ou courriel"
          style={styles.recherche}
          onSubmitEditing={chargerUtilisateurs}
        />

        <View style={styles.filtres}>
          {["", ...ROLES].map((role) => (
            <Pressable
              key={role || "tous"}
              onPress={() => setRoleFiltre(role)}
              style={[
                styles.filtre,
                roleFiltre === role &&
                  styles.filtreActif,
              ]}
            >
              <Text
                style={[
                  styles.filtreTexte,
                  roleFiltre === role &&
                    styles.filtreTexteActif,
                ]}
              >
                {role || "tous"}
              </Text>
            </Pressable>
          ))}
        </View>

        {chargement ? (
          <View style={styles.centre}>
            <ActivityIndicator size="large" />
          </View>
        ) : (
          <FlatList
            data={utilisateurs}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.liste}
            ListEmptyComponent={
              <Text style={styles.vide}>
                Aucun utilisateur trouvé.
              </Text>
            }
            renderItem={({ item }) => (
              <View style={styles.carte}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarTexte}>
                    {item.nom
                      ?.charAt(0)
                      .toUpperCase()}
                  </Text>
                </View>

                <View style={styles.informations}>
                  <Text style={styles.nom}>
                    {item.nom}
                  </Text>

                  <Text style={styles.courriel}>
                    {item.courriel}
                  </Text>

                  <View style={styles.badge}>
                    <Text style={styles.badgeTexte}>
                      {item.role}
                    </Text>
                  </View>
                </View>

                <View style={styles.actions}>
                  <Pressable
                    onPress={() =>
                      changerRole(
                        item._id,
                        item.role
                      )
                    }
                    style={styles.boutonModifier}
                  >
                    <Text
                      style={
                        styles.boutonModifierTexte
                      }
                    >
                      Rôle
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() =>
                      supprimerUtilisateur(
                        item._id,
                        item.nom
                      )
                    }
                    style={styles.boutonSupprimer}
                  >
                    <Text
                      style={
                        styles.boutonSupprimerTexte
                      }
                    >
                      Supprimer
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },

  page: {
    flex: 1,
    paddingHorizontal: 20,
  },

  entete: {
    marginTop: 15,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
  },

  retour: {
    width: 45,
    height: 45,
    marginRight: 12,
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },

  retourTexte: {
    color: "#F97316",
    fontSize: 34,
    lineHeight: 38,
  },

  titre: {
    fontSize: 29,
    fontWeight: "900",
    color: "#111111",
  },

  sousTitre: {
    color: "#777777",
    marginTop: 3,
  },

  recherche: {
    height: 53,
    borderRadius: 17,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7E7E7",
    marginBottom: 14,
  },

  filtres: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 13,
  },

  filtre: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: "#FFFFFF",
  },

  filtreActif: {
    backgroundColor: "#F97316",
  },

  filtreTexte: {
    color: "#666666",
    fontWeight: "700",
    textTransform: "capitalize",
  },

  filtreTexteActif: {
    color: "#FFFFFF",
  },

  centre: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  liste: {
    paddingBottom: 40,
  },

  carte: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 15,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ECECEC",
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFF0E6",
    justifyContent: "center",
    alignItems: "center",
  },

  avatarTexte: {
    color: "#F97316",
    fontSize: 20,
    fontWeight: "900",
  },

  informations: {
    flex: 1,
    marginLeft: 12,
  },

  nom: {
    color: "#111111",
    fontSize: 16,
    fontWeight: "900",
  },

  courriel: {
    color: "#777777",
    marginTop: 3,
    fontSize: 13,
  },

  badge: {
    alignSelf: "flex-start",
    marginTop: 7,
    paddingHorizontal: 9,
    paddingVertical: 4,
    backgroundColor: "#FFF0E6",
    borderRadius: 10,
  },

  badgeTexte: {
    color: "#F97316",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "capitalize",
  },

  actions: {
    alignItems: "flex-end",
  },

  boutonModifier: {
    backgroundColor: "#111111",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 7,
  },

  boutonModifierTexte: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 12,
  },

  boutonSupprimer: {
    backgroundColor: "#FFE8E8",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
  },

  boutonSupprimerTexte: {
    color: "#D93434",
    fontWeight: "800",
    fontSize: 11,
  },

  vide: {
    marginTop: 80,
    textAlign: "center",
    color: "#777777",
  },
});