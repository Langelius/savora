function verifierAdmin(req, res, next) {
  if (!req.utilisateur) {
    return res.status(401).json({
      message: "Utilisateur non authentifié.",
    });
  }

  if (req.utilisateur.role !== "admin") {
    return res.status(403).json({
      message: "Accès réservé aux administrateurs.",
    });
  }

  next();
}

module.exports = verifierAdmin;