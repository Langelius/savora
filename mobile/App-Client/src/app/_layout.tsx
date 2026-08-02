import { ActivityIndicator, View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { AuthProvider, useAuth } from "../context/AuthContext";
import { PanierProvider } from "../context/PanierContext";
import { palette } from "../constants/design";

// Tant que la session enregistrée n'a pas été relue, on affiche un écran
// d'attente : sans cela, un utilisateur déjà connecté voyait brièvement
// l'écran d'accueil avant d'être reconnecté.
function Navigation() {
  const { pret } = useAuth();

  if (!pret) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.fond, justifyContent: "center" }}>
        <ActivityIndicator size="large" color={palette.orange} />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }} />;
}

export default function Layout() {
  return (
    <AuthProvider>
      <PanierProvider>
        <StatusBar style="dark" />
        <Navigation />
      </PanierProvider>
    </AuthProvider>
  );
}
