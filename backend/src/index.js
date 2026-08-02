const http = require("http");
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connecterBaseDeDonnees = require("./config/db");
const { initialiserSocket } = require("./config/socket");
const routesAuth = require("./routes/auth");
const routesCommandes = require("./routes/commandes");
const routesRestaurants = require("./routes/restaurants");
const routesAdmin = require("./routes/adminRoutes");
const routesMessages = require("./routes/messages");
const { routeIntrouvable, gererErreurs } = require("./middleware/erreurs");


const application = express();
application.disable("x-powered-by");
application.use(cors({ origin: true, credentials: true }));
application.use(express.json({ limit: "1mb" }));
application.get("/", (_req, res) => res.json({ nom: "API Savora", statut: "en ligne", version: "2.1.0" }));
application.get("/api/sante", (_req, res) => res.json({ ok: true, date: new Date().toISOString() }));
application.use("/api/auth", routesAuth);
application.use("/api/restaurants", routesRestaurants);
application.use("/api/commandes", routesCommandes);
application.use("/api/commandes", routesMessages);
application.use("/api/admin", routesAdmin);
application.use(routeIntrouvable);
application.use(gererErreurs);

async function demarrer() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI manque dans le fichier .env");
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) throw new Error("JWT_SECRET doit contenir au moins 16 caractères");

  await connecterBaseDeDonnees();
  const serveurHttp = http.createServer(application);
  initialiserSocket(serveurHttp);

  const port = Number(process.env.PORT) || 3000;
  serveurHttp.listen(port, "0.0.0.0", () => {
    console.log(`API Savora et Socket.IO démarrés sur http://localhost:${port}`);
    console.log(`Depuis le téléphone : http://192.168.2.15:${port}/api/sante`);
  });
}

if (require.main === module) {
  demarrer().catch((erreur) => {
    console.error("Démarrage impossible :", erreur.message);
    process.exit(1);
  });
}

module.exports = application;
