import { Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import { palette } from "../constants/design";

export function BoutonPrincipal({ titre, onPress, style, desactive = false }: { titre: string; onPress: () => void; style?: ViewStyle; desactive?: boolean }) {
  return (
    <Pressable disabled={desactive} onPress={onPress} style={({ pressed }) => [styles.bouton, desactive && styles.desactive, pressed && styles.presse, style]}>
      <Text style={styles.texte}>{titre}</Text>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  bouton: { backgroundColor: palette.orange, borderRadius: 18, paddingVertical: 16, paddingHorizontal: 20, alignItems: "center" },
  texte: { color: palette.blanc, fontSize: 16, fontWeight: "800" },
  presse: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  desactive: { opacity: 0.45 },
});
