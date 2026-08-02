import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import { palette } from "../constants/design";

// Version web de l'écran de carte.
//
// Metro résout les extensions de plateforme avant le fichier générique : sur
// le web c'est ce fichier qui est retenu, et « carte-livraison.tsx » — qui
// importe react-native-maps — n'entre jamais dans le paquet navigateur.
// C'est indispensable : react-native-maps importe des modules internes de
// React Native absents du web, et un import conditionnel ne suffirait pas
// puisque Metro analyse les require() à la compilation.
//
// La carte est ici rendue par Leaflet, chargé depuis un CDN :
//   - aucune clé d'API, contrairement à Google Maps ;
//   - aucune dépendance npm supplémentaire à installer et à maintenir ;
//   - les fonds de carte viennent d'OpenStreetMap, libres d'utilisation.
//
// Sur le web, React rend du DOM : les éléments HTML comme <div> sont donc
// utilisables directement, ce qui n'est pas le cas sur mobile.

const VERSION_LEAFLET = "1.9.4";
const CSS_LEAFLET = `https://unpkg.com/leaflet@${VERSION_LEAFLET}/dist/leaflet.css`;
const JS_LEAFLET = `https://unpkg.com/leaflet@${VERSION_LEAFLET}/dist/leaflet.js`;

const POSITION_RESTAURANT = { latitude: 45.50169, longitude: -73.567253 };
const POSITION_CLIENT = { latitude: 45.50884, longitude: -73.58781 };

// Charge une ressource externe une seule fois, même si l'écran est rouvert.
function chargerRessource(url: string, type: "css" | "js"): Promise<void> {
  return new Promise((resoudre, rejeter) => {
    const selecteur = type === "css" ? `link[href="${url}"]` : `script[src="${url}"]`;
    if (document.querySelector(selecteur)) return resoudre();

    const element =
      type === "css"
        ? Object.assign(document.createElement("link"), { rel: "stylesheet", href: url })
        : Object.assign(document.createElement("script"), { src: url, async: true });

    element.addEventListener("load", () => resoudre());
    element.addEventListener("error", () => rejeter(new Error(`Chargement impossible : ${url}`)));
    document.head.appendChild(element);
  });
}

export default function CarteLivraisonWeb() {
  const router = useRouter();

  const { restaurant, adresse } = useLocalSearchParams<{
    restaurant?: string;
    adresse?: string;
  }>();

  const conteneur = useRef<HTMLDivElement | null>(null);
  const [etat, setEtat] = useState<"chargement" | "prete" | "echec">("chargement");

  useEffect(() => {
    let annule = false;

    async function construireCarte() {
      try {
        await chargerRessource(CSS_LEAFLET, "css");
        await chargerRessource(JS_LEAFLET, "js");

        if (annule || !conteneur.current) return;

        const L = (globalThis as unknown as { L: any }).L;
        if (!L) throw new Error("Leaflet indisponible");

        const carte = L.map(conteneur.current).setView(
          [
            (POSITION_RESTAURANT.latitude + POSITION_CLIENT.latitude) / 2,
            (POSITION_RESTAURANT.longitude + POSITION_CLIENT.longitude) / 2,
          ],
          14
        );

        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "© OpenStreetMap",
        }).addTo(carte);

        L.marker([POSITION_RESTAURANT.latitude, POSITION_RESTAURANT.longitude])
          .addTo(carte)
          .bindPopup(`<b>${restaurant ?? "Restaurant"}</b><br>Point de récupération`);

        L.marker([POSITION_CLIENT.latitude, POSITION_CLIENT.longitude])
          .addTo(carte)
          .bindPopup(`<b>Client</b><br>${adresse ?? "Adresse de livraison"}`);

        L.polyline(
          [
            [POSITION_RESTAURANT.latitude, POSITION_RESTAURANT.longitude],
            [POSITION_CLIENT.latitude, POSITION_CLIENT.longitude],
          ],
          { color: palette.orange, weight: 4, dashArray: "8 6" }
        ).addTo(carte);

        // Position réelle du navigateur, si l'utilisateur l'autorise.
        // Un refus n'a rien d'anormal : la carte reste utilisable.
        navigator.geolocation?.getCurrentPosition(
          (position) => {
            if (annule) return;
            L.circleMarker([position.coords.latitude, position.coords.longitude], {
              radius: 9,
              color: "#1E6FD9",
              fillColor: "#1E6FD9",
              fillOpacity: 0.85,
            })
              .addTo(carte)
              .bindPopup("<b>Vous</b><br>Position actuelle");
          },
          () => {},
          { enableHighAccuracy: true, timeout: 8000 }
        );

        if (!annule) setEtat("prete");
      } catch (erreur) {
        console.log("Carte web indisponible :", erreur);
        if (!annule) setEtat("echec");
      }
    }

    construireCarte();
    return () => {
      annule = true;
    };
  }, [restaurant, adresse]);

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

      <View style={styles.zoneCarte}>
        {/* Élément DOM : valide uniquement sur le web. */}
        <div
          ref={conteneur}
          style={{ width: "100%", height: "100%", display: etat === "echec" ? "none" : "block" }}
        />

        {etat === "chargement" && (
          <View style={styles.voile}>
            <ActivityIndicator size="large" color={palette.orange} />
            <Text style={styles.doux}>Chargement de la carte…</Text>
          </View>
        )}

        {etat === "echec" && (
          <View style={styles.voile}>
            <Text style={styles.emoji}>🗺️</Text>
            <Text style={styles.titre}>Carte indisponible</Text>
            <Text style={styles.explication}>
              Le fond de carte n'a pas pu être chargé. Vérifie ta connexion, ou
              ouvre Savora sur ton téléphone pour le suivi cartographique complet.
            </Text>
          </View>
        )}
      </View>

      <Text style={styles.mention}>
        Fond de carte © OpenStreetMap. Le suivi en direct de la position du livreur
        reste réservé à l'application mobile.
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.fond },
  entete: { padding: 20, flexDirection: "row", alignItems: "center", gap: 14 },
  retour: {
    paddingVertical: 9,
    paddingHorizontal: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.bordure,
    backgroundColor: palette.blanc,
  },
  retourTexte: { fontWeight: "800", color: palette.texte },
  enteteTexte: { flex: 1 },
  titre: { fontSize: 20, fontWeight: "900", color: palette.texte },
  doux: { color: palette.texteDoux, marginTop: 3 },
  zoneCarte: {
    flex: 1,
    marginHorizontal: 20,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: palette.bordure,
    backgroundColor: palette.blanc,
  },
  voile: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    backgroundColor: palette.fond,
  },
  emoji: { fontSize: 52, marginBottom: 12 },
  explication: {
    color: palette.texteDoux,
    textAlign: "center",
    marginTop: 10,
    lineHeight: 22,
    maxWidth: 420,
  },
  mention: {
    color: palette.texteDoux,
    fontSize: 12,
    textAlign: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
});
