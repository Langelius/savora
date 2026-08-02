function autoriserRoles(...rolesAutorises) {
  return (req, res, next) => {
    if (!req.utilisateur || !rolesAutorises.includes(req.utilisateur.role)) {
      return res.status(403).json({ message: "Accès interdit pour ce rôle" });
    }
    next();
  };
}

module.exports = autoriserRoles;
