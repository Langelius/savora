const http = require("http");
const os = require("os");
const express = require("express");
const cors = require("cors");

const { environnement, validerEnvironnement } = require("./config/environnement");
const connecterBaseDeDonnees = require("./config/db");
const { initialiserSocket } = require("./config/socket");
const { entetesSecurite, limiteurRequetes, politiqueCors } = require("./middleware/securite");
const { routeIntrouvable, gererErreurs } = require("./middleware/erreurs");
const { modePaiementActif } = require("./services/paiement");

const routesAuth = require("./routes/auth");
const routesCommandes = require("./routes/commandes");
const routesRestaurants = require("./routes/restaurants");
const routesAdmin = require("./routes/adminRoutes");
const routesMessages = require("./routes/messages");
const routesMonRestaurant = require("./routes/monRestaurant");
const routesNotifications = require("./routes/notifications");

const VERSION_API = "3.0.0";

const application = express();

application.disable("x-powered-by");
// Nécessaire derrière un proxy (Render, Railway) pour que req.ip soit
// l'adresse réelle du client et non celle du proxy : sans cela le limiteur
// de débit compterait tout le trafic sur une seule adresse.
application.set("trust proxy", 1);

application.use(entetesSecurite);
application.use(cors(politiqueCors()));
application.use(express.json({ limit: "1mb" }));

// Garde-fou global, très large : il n'arrête pas un usage normal mais
// plafonne un client qui boucle sur l'API.
application.use(
  limiteurRequetes({
    fenetreMs: 60 * 1000,
    maximum: 300,
    message: "Trop de requêtes. Ralentis un peu.",
  })
);

application.get("/", (_requete, reponse) =>
  reponse.json({ nom: "API Savora", statut: "en ligne", version: VERSION_API })
);

application.get("/api/sante", (_requete, reponse) =>
  reponse.json({ ok: true, date: new Date().toISOString() })
);

// Configuration publique consommée par l'application mobile.
// Le taux de taxes n'est ainsi écrit qu'à un seul endroit du projet.
application.get("/api/configuration", (_requete, reponse) =>
  reponse.json({
    version: VERSION_API,
    tauxTaxes: environnement.TAUX_TAXES,
    devise: "CAD",
    modePaiement: modePaiementActif(),
  })
);

application.use("/api/auth", routesAuth);
application.use("/api/restaurants", routesRestaurants);
application.use("/api/commandes", routesCommandes);
application.use("/api/commandes", routesMessages);
application.use("/api/mon-restaurant", routesMonRestaurant);
application.use("/api/notifications", routesNotifications);
application.use("/api/admin", routesAdmin);

application.use(routeIntrouvable);
application.use(gererErreurs);

// Affiche les adresses IPv4 réelles de la machine plutôt qu'une adresse
// codée en dur, qui devenait fausse à chaque changement de réseau.
function adressesLocales() {
  const adresses = [];
  const interfaces = os.networkInterfaces();

  for (const cartes of Object.values(interfaces)) {
    for (const carte of cartes || []) {
      if (carte.family === "IPv4" && !carte.internal) adresses.push(carte.address);
    }
  }

  return adresses;
}

async function demarrer() {
  validerEnvironnement();
  await connecterBaseDeDonnees();

  const serveurHttp = http.createServer(application);
  initialiserSocket(serveurHttp);

  serveurHttp.listen(environnement.port, "0.0.0.0", () => {
    console.log(`API Savora ${VERSION_API} et Socket.IO démarrés`);
    console.log(`  local     : http://localhost:${environnement.port}/api/sante`);
    for (const adresse of adressesLocales()) {
      console.log(`  téléphone : http://${adresse}:${environnement.port}/api/sante`);
    }
    console.log(`  paiement  : mode ${modePaiementActif()}`);
  });

  return serveurHttp;
}

if (require.main === module) {
  demarrer().catch((erreur) => {
    console.error("Démarrage impossible :", erreur.message);
    process.exit(1);
  });
}

module.exports = application;
module.exports.demarrer = demarrer;
