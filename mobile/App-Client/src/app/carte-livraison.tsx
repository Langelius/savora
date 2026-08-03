// Route de la carte de livraison.
//
// Le fichier ne contient volontairement aucune logique : il se contente de
// réexporter le composant. Expo Router énumère les fichiers de ce dossier
// avec require.context, ce qui les inclut TOUS dans le paquet, quelle que
// soit leur extension de plateforme. Y placer un import de react-native-maps
// ferait donc échouer la construction du paquet web.
//
// L'import ci-dessous, lui, est un import normal : Metro applique sa
// résolution de plateforme et choisit CarteLivraison.tsx sur mobile,
// CarteLivraison.web.tsx dans le navigateur.
export { default } from "../components/CarteLivraison";
