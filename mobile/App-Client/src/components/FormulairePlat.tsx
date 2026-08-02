import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import { OptionPlat, Plat, PlatModifiable } from "../services/api";
import { palette } from "../constants/design";

// Formulaire de création et d'édition d'un plat, partagé par le tableau de
// bord restaurant et l'espace d'administration : une seule règle de saisie,
// un seul endroit à corriger.
export function FormulairePlat({
  visible,
  plat,
  enregistrement,
  onFermer,
  onEnregistrer,
}: {
  visible: boolean;
  plat: Plat | null;
  enregistrement: boolean;
  onFermer: () => void;
  onEnregistrer: (champs: PlatModifiable) => void;
}) {
  const [nom, setNom] = useState(plat?.nom ?? "");
  const [description, setDescription] = useState(plat?.description ?? "");
  const [prix, setPrix] = useState(plat ? String(plat.prix) : "");
  const [categorie, setCategorie] = useState(plat?.categorie ?? "");
  const [image, setImage] = useState(plat?.image ?? "");
  const [populaire, setPopulaire] = useState(Boolean(plat?.populaire));
  const [options, setOptions] = useState<OptionPlat[]>(plat?.options ?? []);
  const [erreur, setErreur] = useState<string | null>(null);

  const ajouterOption = () => setOptions((actuelles) => [...actuelles, { nom: "", prix: 0 }]);

  const modifierOption = (index: number, champ: "nom" | "prix", valeur: string) => {
    setOptions((actuelles) =>
      actuelles.map((option, i) =>
        i !== index
          ? option
          : champ === "nom"
            ? { ...option, nom: valeur }
            : { ...option, prix: Number(valeur.replace(",", ".")) || 0 }
      )
    );
  };

  const retirerOption = (index: number) =>
    setOptions((actuelles) => actuelles.filter((_, i) => i !== index));

  // Les mêmes règles que le serveur, vérifiées ici pour éviter un aller-retour
  // réseau inutile. Le serveur reste la source de vérité.
  const soumettre = () => {
    const montant = Number(prix.replace(",", "."));

    if (nom.trim().length < 2) return setErreur("Le nom du plat est trop court.");
    if (categorie.trim().length < 2) return setErreur("La catégorie est obligatoire.");
    if (!/^https?:\/\//i.test(image.trim())) {
      return setErreur("L'image doit être une URL commençant par http ou https.");
    }
    if (!Number.isFinite(montant) || montant <= 0) {
      return setErreur("Le prix doit être supérieur à zéro.");
    }

    const nettoyees: OptionPlat[] = [];
    const vus = new Set<string>();

    for (const option of options) {
      const nomOption = option.nom.trim();
      if (!nomOption) continue;
      if (vus.has(nomOption)) return setErreur(`Option en double : ${nomOption}`);
      vus.add(nomOption);
      nettoyees.push({ nom: nomOption, prix: option.prix });
    }

    setErreur(null);
    onEnregistrer({
      nom: nom.trim(),
      description: description.trim(),
      prix: montant,
      categorie: categorie.trim(),
      image: image.trim(),
      populaire,
      options: nettoyees,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onFermer}>
      <View style={styles.voile}>
        <View style={styles.feuille}>
          <Text style={styles.titre}>{plat ? "Modifier le plat" : "Nouveau plat"}</Text>

          <ScrollView style={styles.corps} keyboardShouldPersistTaps="handled">
            <Champ libelle="Nom" valeur={nom} onChange={setNom} placeholder="Pizza burrata" />
            <Champ
              libelle="Description"
              valeur={description}
              onChange={setDescription}
              placeholder="Tomates rôties, burrata et basilic"
              multiligne
            />
            <Champ
              libelle="Prix ($)"
              valeur={prix}
              onChange={setPrix}
              placeholder="20.00"
              clavier="decimal-pad"
            />
            <Champ
              libelle="Catégorie"
              valeur={categorie}
              onChange={setCategorie}
              placeholder="Pizzas"
            />
            <Champ
              libelle="Image (URL)"
              valeur={image}
              onChange={setImage}
              placeholder="https://..."
            />

            <View style={styles.bascule}>
              <Text style={styles.libelle}>Mettre en avant</Text>
              <Switch
                value={populaire}
                onValueChange={setPopulaire}
                trackColor={{ true: palette.orange }}
              />
            </View>

            <View style={styles.enteteOptions}>
              <Text style={styles.sousTitre}>Options de personnalisation</Text>
              <Pressable onPress={ajouterOption} hitSlop={8}>
                <Text style={styles.ajouter}>+ Ajouter</Text>
              </Pressable>
            </View>

            <Text style={styles.aide}>
              Un supplément à 0 $ reste un choix offert au client (« sans oignons »).
            </Text>

            {options.length === 0 && <Text style={styles.vide}>Aucune option.</Text>}

            {options.map((option, index) => (
              <View key={index} style={styles.ligneOption}>
                <TextInput
                  value={option.nom}
                  onChangeText={(v) => modifierOption(index, "nom", v)}
                  placeholder="Bacon"
                  style={[styles.champ, styles.optionNom]}
                />
                <TextInput
                  value={String(option.prix)}
                  onChangeText={(v) => modifierOption(index, "prix", v)}
                  placeholder="0"
                  keyboardType="decimal-pad"
                  style={[styles.champ, styles.optionPrix]}
                />
                <Pressable onPress={() => retirerOption(index)} hitSlop={8}>
                  <Text style={styles.retirer}>✕</Text>
                </Pressable>
              </View>
            ))}

            {erreur && <Text style={styles.erreur}>{erreur}</Text>}
          </ScrollView>

          <View style={styles.actions}>
            <Pressable onPress={onFermer} style={styles.annuler}>
              <Text style={styles.annulerTexte}>Annuler</Text>
            </Pressable>
            <Pressable
              onPress={soumettre}
              disabled={enregistrement}
              style={[styles.valider, enregistrement && styles.desactive]}
            >
              <Text style={styles.validerTexte}>
                {enregistrement ? "Enregistrement..." : "Enregistrer"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Champ({
  libelle,
  valeur,
  onChange,
  placeholder,
  clavier,
  multiligne = false,
}: {
  libelle: string;
  valeur: string;
  onChange: (v: string) => void;
  placeholder?: string;
  clavier?: "decimal-pad";
  multiligne?: boolean;
}) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.libelle}>{libelle}</Text>
      <TextInput
        value={valeur}
        onChangeText={onChange}
        placeholder={placeholder}
        keyboardType={clavier}
        multiline={multiligne}
        autoCapitalize="sentences"
        style={[styles.champ, multiligne && styles.multiligne]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  voile: { flex: 1, backgroundColor: "rgba(20,14,9,0.5)", justifyContent: "flex-end" },
  feuille: {
    backgroundColor: palette.fond,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 22,
    maxHeight: "90%",
  },
  titre: { fontSize: 24, fontWeight: "900", marginBottom: 16 },
  corps: { marginBottom: 12 },
  libelle: { fontWeight: "800", marginBottom: 6, fontSize: 14 },
  champ: {
    backgroundColor: palette.blanc,
    borderWidth: 1,
    borderColor: palette.bordure,
    borderRadius: 14,
    padding: 13,
    fontSize: 15,
  },
  multiligne: { minHeight: 78, textAlignVertical: "top" },
  bascule: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 8,
  },
  enteteOptions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
  },
  sousTitre: { fontSize: 17, fontWeight: "900" },
  ajouter: { color: palette.orangeFonce, fontWeight: "900" },
  aide: { color: palette.texteDoux, fontSize: 12, marginTop: 4, marginBottom: 10 },
  vide: { color: palette.texteDoux, marginBottom: 10 },
  ligneOption: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  optionNom: { flex: 3 },
  optionPrix: { flex: 1 },
  retirer: { color: palette.danger, fontSize: 18, fontWeight: "900", paddingHorizontal: 4 },
  erreur: { color: palette.danger, fontWeight: "700", marginTop: 10 },
  actions: { flexDirection: "row", gap: 12 },
  annuler: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.bordure,
    alignItems: "center",
  },
  annulerTexte: { fontWeight: "800" },
  valider: {
    flex: 2,
    padding: 16,
    borderRadius: 16,
    backgroundColor: palette.orange,
    alignItems: "center",
  },
  desactive: { opacity: 0.5 },
  validerTexte: { color: palette.blanc, fontWeight: "900" },
});
