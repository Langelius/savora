import { ImageBackground, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { palette } from "../constants/design";

export default function Home() {
  const router = useRouter();
  return <ImageBackground source={{ uri: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1400" }} style={styles.fond}>
    <View style={styles.voile} />
    <SafeAreaView style={styles.safe}>
      <View style={styles.logo}><Text style={styles.logoTexte}>SAVORA</Text><View style={styles.point} /></View>
      <View style={styles.contenu}>
        <Text style={styles.surtitre}>LIVRAISON GOURMANDE</Text>
        <Text style={styles.titre}>Les meilleures tables,{"\n"}chez toi.</Text>
        <Text style={styles.description}>Découvre des restaurants soigneusement sélectionnés et commande en quelques gestes.</Text>
        <Pressable onPress={() => router.push("/login")} style={styles.bouton}><Text style={styles.boutonTexte}>Commencer</Text><Text style={styles.fleche}>→</Text></Pressable>
        <Pressable onPress={() => router.push("/restaurants")}><Text style={styles.invite}>Continuer comme invité</Text></Pressable>
      </View>
    </SafeAreaView>
  </ImageBackground>;
}
const styles = StyleSheet.create({
  fond: { flex: 1 }, voile: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(20,14,9,0.58)" }, safe: { flex: 1, padding: 24 },
  logo: { flexDirection: "row", alignItems: "center", marginTop: 8 }, logoTexte: { color: palette.blanc, fontWeight: "900", letterSpacing: 4, fontSize: 20 }, point: { width: 8, height: 8, borderRadius: 4, backgroundColor: palette.orange, marginLeft: 5 },
  contenu: { flex: 1, justifyContent: "flex-end", paddingBottom: 36 }, surtitre: { color: "#FFD8B8", fontWeight: "800", letterSpacing: 2, fontSize: 12, marginBottom: 14 }, titre: { color: palette.blanc, fontSize: 44, lineHeight: 50, fontWeight: "900" }, description: { color: "#F7EDE3", fontSize: 16, lineHeight: 24, marginTop: 16, maxWidth: 360 },
  bouton: { marginTop: 30, borderRadius: 20, backgroundColor: palette.orange, paddingVertical: 17, paddingHorizontal: 22, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, boutonTexte: { color: palette.blanc, fontSize: 17, fontWeight: "900" }, fleche: { color: palette.blanc, fontSize: 23 }, invite: { color: palette.blanc, textAlign: "center", marginTop: 20, fontWeight: "700" },
});
