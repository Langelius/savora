import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "../context/AuthContext";
import { PanierProvider } from "../context/PanierContext";
export default function Layout(){return <AuthProvider><PanierProvider><StatusBar style="dark"/><Stack screenOptions={{headerShown:false,animation:"slide_from_right"}}/></PanierProvider></AuthProvider>}
