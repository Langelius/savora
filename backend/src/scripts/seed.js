// Jeu de données de démonstration : restaurants, plats et options.
// Usage : npm run seed  (efface puis recharge le catalogue)
require("../config/environnement");

const mongoose = require("mongoose");

const connecterBaseDeDonnees = require("../config/db");
const Restaurant = require("../models/Restaurant");
const Plat = require("../models/Plat");

const donnees = [
  {
    restaurant: {
      nom: "Maison Sienna",
      cuisine: "Cuisine italienne",
      description: "Une table italienne moderne et généreuse.",
      image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200",
      adresse: "1420 rue Sainte-Catherine Ouest, Montréal",
      delai: "20–30 min",
      fraisLivraison: 2.49,
    },
    plats: [
      {
        nom: "Pasta tartufo",
        description: "Crème de parmesan, champignons et huile de truffe.",
        prix: 22.5,
        categorie: "Pâtes",
        image: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=900",
        populaire: true,
        options: [
          { nom: "Supplément truffe", prix: 4 },
          { nom: "Sans gluten", prix: 2 },
          { nom: "Poulet grillé", prix: 5 },
        ],
      },
      {
        nom: "Pizza burrata",
        description: "Tomates rôties, burrata et basilic frais.",
        prix: 20,
        categorie: "Pizzas",
        image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=900",
        options: [
          { nom: "Grand format", prix: 5 },
          { nom: "Base épicée", prix: 0 },
        ],
      },
    ],
  },
  {
    restaurant: {
      nom: "Atelier Burger",
      cuisine: "Burgers gourmets",
      description: "Des burgers généreux préparés à la minute.",
      image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200",
      adresse: "255 avenue du Mont-Royal Est, Montréal",
      delai: "15–25 min",
      fraisLivraison: 1.99,
    },
    plats: [
      {
        nom: "Le Signature",
        description: "Bœuf, cheddar vieilli, oignons confits et sauce maison.",
        prix: 18.5,
        categorie: "Burgers",
        image: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=900",
        populaire: true,
        options: [
          { nom: "Double galette", prix: 6 },
          { nom: "Bacon", prix: 3 },
          { nom: "Sans oignons", prix: 0 },
        ],
      },
      {
        nom: "Frites parmesan",
        description: "Frites dorées, parmesan et herbes.",
        prix: 7,
        categorie: "Accompagnements",
        image: "https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=900",
        options: [{ nom: "Format familial", prix: 4 }],
      },
    ],
  },
  {
    restaurant: {
      nom: "Nami Sushi",
      cuisine: "Cuisine japonaise",
      description: "Sushis raffinés et poissons sélectionnés.",
      image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=1200",
      adresse: "78 rue Saint-Paul Ouest, Montréal",
      delai: "30–40 min",
      fraisLivraison: 3.49,
    },
    plats: [
      {
        nom: "Plateau Nami",
        description: "16 morceaux : saumon, thon, crevette et avocat.",
        prix: 28,
        categorie: "Plateaux",
        image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=900",
        populaire: true,
        options: [
          { nom: "Sauce épicée", prix: 0 },
          { nom: "Gingembre supplémentaire", prix: 1 },
        ],
      },
      {
        nom: "Saumon aburi",
        description: "Saumon légèrement flambé et sauce ponzu.",
        prix: 19.5,
        categorie: "Sushis",
        image: "https://images.unsplash.com/photo-1563612116625-3012372fccce?w=900",
        options: [{ nom: "Portion double", prix: 8 }],
      },
    ],
  },
];

// Par défaut, le seed est NON destructif : il crée ce qui manque et met à jour
// ce qui existe, en identifiant les enregistrements par leur nom. Les
// restaurants ajoutés depuis l'application ne sont donc jamais effacés.
//
// Pour repartir d'une base propre : npm run seed -- --reinitialiser
const REINITIALISER = process.argv.includes("--reinitialiser");

async function remplirBase() {
  await connecterBaseDeDonnees();

  if (REINITIALISER) {
    console.log("Mode réinitialisation : suppression du catalogue existant.");
    await Promise.all([Restaurant.deleteMany({}), Plat.deleteMany({})]);
  }

  for (const bloc of donnees) {
    // La note et le nombre d'avis ne sont jamais écrits ici : ils sont
    // calculés à partir des avis réels. Un seed ne doit pas les écraser.
    const restaurant = await Restaurant.findOneAndUpdate(
      { nom: bloc.restaurant.nom },
      { $set: bloc.restaurant },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    let ajoutes = 0;
    for (const plat of bloc.plats) {
      await Plat.findOneAndUpdate(
        { restaurantId: restaurant._id, nom: plat.nom },
        { $set: { ...plat, restaurantId: restaurant._id } },
        { upsert: true, runValidators: true, setDefaultsOnInsert: true }
      );
      ajoutes += 1;
    }

    console.log(`  ${restaurant.nom} : ${ajoutes} plats à jour`);
  }

  const total = await Restaurant.countDocuments();
  console.log(
    REINITIALISER
      ? "Catalogue Savora réinitialisé."
      : `Catalogue Savora à jour. ${total} restaurants en base (les autres sont conservés).`
  );

  await mongoose.disconnect();
}

remplirBase().catch(async (erreur) => {
  console.error("Chargement impossible :", erreur.message);
  await mongoose.disconnect();
  process.exit(1);
});
