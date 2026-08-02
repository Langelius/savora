import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";

import { palette } from "../constants/design";

// Version native de l'écran de carte.
//
// react-native-maps importe des modules internes de React Native qui
// n'existent pas dans un navigateur. Un import conditionnel ne suffit pas :
// Metro analyse les require() à la compilation et inclut le module quand
// même. La séparation se fait donc par extension de fichier — Metro résout
// « carte-livraison.web.tsx » en priorité sur le web, et ce fichier-ci n'y
// est jamais inclus.
import MapView, { Marker, Polyline } from "react-native-maps";

type Coordonnees = {
  latitude: number;
  longitude: number;
};

const POSITION_RESTAURANT: Coordonnees = {
  latitude: 45.50169,
  longitude: -73.567253,
};

const POSITION_CLIENT: Coordonnees = {
  latitude: 45.50884,
  longitude: -73.58781,
};

export default function CarteLivraison() {
  const router = useRouter();

  const { restaurant, adresse } = useLocalSearchParams<{
    restaurant?: string;
    adresse?: string;
  }>();

  const [positionLivreur, setPositionLivreur] =
    useState<Coordonnees | null>(null);

  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    let abonnement: Location.LocationSubscription | null = null;

    async function chargerLocalisation() {
      try {
        const permission =
          await Location.requestForegroundPermissionsAsync();

        if (permission.status !== "granted") {
          Alert.alert(
            "Permission refusée",
            "La localisation est nécessaire pour afficher la position du livreur."
          );

          setPositionLivreur(POSITION_RESTAURANT);
          return;
        }

        const position =
          await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });

        setPositionLivreur({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });

        abonnement = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            distanceInterval: 5,
            timeInterval: 5000,
          },
          (nouvellePosition) => {
            setPositionLivreur({
              latitude: nouvellePosition.coords.latitude,
              longitude: nouvellePosition.coords.longitude,
            });
          }
        );
      } catch (erreur) {
        console.error(erreur);

        Alert.alert(
          "Localisation impossible",
          "Impossible de récupérer la position actuelle."
        );

        setPositionLivreur(POSITION_RESTAURANT);
      } finally {
        setChargement(false);
      }
    }

    chargerLocalisation();

    return () => {
      abonnement?.remove();
    };
  }, []);

  if (chargement || !positionLivreur) {
    return (
      <SafeAreaView style={styles.centre}>
        <ActivityIndicator size="large" />
        <Text style={styles.doux}>Chargement de la carte…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.entete}>
        <Pressable onPress={() => router.back()} style={styles.retour}>
          <Text style={styles.retourTexte}>← Retour</Text>
        </Pressable>

        <View style={styles.enteteTexte}>
          <Text style={styles.titre}>Carte de livraison</Text>

          <Text style={styles.doux}>
            {restaurant ?? "Restaurant"} → {adresse ?? "Client"}
          </Text>
        </View>
      </View>

      <MapView
        style={styles.carte}
        initialRegion={{
          latitude:
            (POSITION_RESTAURANT.latitude + POSITION_CLIENT.latitude) / 2,
          longitude:
            (POSITION_RESTAURANT.longitude + POSITION_CLIENT.longitude) / 2,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04,
        }}
        showsUserLocation
        showsMyLocationButton
      >
        <Marker
          coordinate={positionLivreur}
          title="Livreur"
          description="Votre position actuelle"
          pinColor="blue"
        />

        <Marker
          coordinate={POSITION_RESTAURANT}
          title={restaurant ?? "Restaurant"}
          description="Point de récupération de la commande"
        />

        <Marker
          coordinate={POSITION_CLIENT}
          title="Client"
          description={adresse ?? "Adresse de livraison"}
          pinColor="green"
        />

        <Polyline
          coordinates={[
            positionLivreur,
            POSITION_RESTAURANT,
            POSITION_CLIENT,
          ]}
          strokeWidth={5}
        />
      </MapView>

      <View style={styles.instructions}>
        <Text style={styles.etape}>1. Rejoindre le restaurant</Text>
        <Text style={styles.etape}>2. Récupérer la commande</Text>
        <Text style={styles.etape}>3. Livrer la commande au client</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: palette.fond,
  },

  centre: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    backgroundColor: palette.fond,
  },

  entete: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
  },

  enteteTexte: {
    flex: 1,
  },

  retour: {
    marginRight: 14,
    paddingVertical: 8,
  },

  retourTexte: {
    color: palette.orangeFonce,
    fontWeight: "900",
  },

  titre: {
    fontSize: 22,
    fontWeight: "900",
    color: palette.texte,
  },

  doux: {
    color: palette.texteDoux,
    marginTop: 4,
  },

  carte: {
    flex: 1,
  },

  instructions: {
    backgroundColor: palette.blanc,
    padding: 18,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: palette.bordure,
  },

  etape: {
    color: palette.texte,
    fontWeight: "800",
  },
});