export type Plat = {
  id: string;
  restaurantId: string;
  nom: string;
  description: string;
  prix: number;
  categorie: string;
  image: string;
  populaire?: boolean;
};

export type Restaurant = {
  id: string;
  nom: string;
  cuisine: string;
  note: number;
  delai: string;
  frais: number;
  image: string;
  badge?: string;
};

export const restaurants: Restaurant[] = [
  { id: "1", nom: "Maison Sienna", cuisine: "Cuisine italienne", note: 4.8, delai: "20–30 min", frais: 2.49, badge: "Le plus aimé", image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200" },
  { id: "2", nom: "Atelier Burger", cuisine: "Burgers gourmets", note: 4.7, delai: "15–25 min", frais: 1.99, badge: "Livraison rapide", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200" },
  { id: "3", nom: "Nami Sushi", cuisine: "Cuisine japonaise", note: 4.9, delai: "30–40 min", frais: 3.49, badge: "Sélection premium", image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=1200" },
];

export const plats: Plat[] = [
  { id: "p1", restaurantId: "1", nom: "Pasta tartufo", description: "Crème de parmesan, champignons et huile de truffe.", prix: 22.5, categorie: "Pâtes", populaire: true, image: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=900" },
  { id: "p2", restaurantId: "1", nom: "Pizza burrata", description: "Tomates rôties, burrata crémeuse et basilic frais.", prix: 20, categorie: "Pizzas", image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=900" },
  { id: "p3", restaurantId: "1", nom: "Tiramisu maison", description: "Mascarpone, café corsé et cacao.", prix: 8.5, categorie: "Desserts", image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=900" },
  { id: "p4", restaurantId: "2", nom: "Le Signature", description: "Bœuf, cheddar vieilli, oignons confits et sauce maison.", prix: 18.5, categorie: "Burgers", populaire: true, image: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=900" },
  { id: "p5", restaurantId: "2", nom: "Poulet croustillant", description: "Poulet épicé, salade croquante et mayo fumée.", prix: 17, categorie: "Burgers", image: "https://images.unsplash.com/photo-1615297928064-24977384d0da?w=900" },
  { id: "p6", restaurantId: "2", nom: "Frites parmesan", description: "Frites dorées, parmesan et herbes.", prix: 7, categorie: "Accompagnements", image: "https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=900" },
  { id: "p7", restaurantId: "3", nom: "Plateau Nami", description: "16 morceaux : saumon, thon, crevette et avocat.", prix: 28, categorie: "Plateaux", populaire: true, image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=900" },
  { id: "p8", restaurantId: "3", nom: "Saumon aburi", description: "Saumon légèrement flambé, sauce ponzu.", prix: 19.5, categorie: "Sushis", image: "https://images.unsplash.com/photo-1563612116625-3012372fccce?w=900" },
  { id: "p9", restaurantId: "3", nom: "Mochis glacés", description: "Trio mangue, vanille et matcha.", prix: 9, categorie: "Desserts", image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=900" },
];
