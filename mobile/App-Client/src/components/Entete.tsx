import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { palette } from "../constants/design";

export function Entete({ titre, retour = false, action }: { titre: string; retour?: boolean; action?: React.ReactNode }) {
  const router = useRouter();
  return <View style={styles.entete}>
    <View style={styles.cote}>{retour && <Pressable onPress={() => router.back()} style={styles.rond}><Text style={styles.fleche}>‹</Text></Pressable>}</View>
    <Text style={styles.titre}>{titre}</Text>
    <View style={[styles.cote, styles.droite]}>{action}</View>
  </View>;
}
const styles = StyleSheet.create({
  entete: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14 },
  cote: { width: 46 }, droite: { alignItems: "flex-end" },
  rond: { width: 42, height: 42, borderRadius: 21, backgroundColor: palette.blanc, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: palette.bordure },
  fleche: { fontSize: 32, lineHeight: 32, color: palette.texte },
  titre: { fontSize: 19, fontWeight: "900", color: palette.texte },
});
