function routeIntrouvable(req,res){res.status(404).json({message:`Route introuvable : ${req.method} ${req.originalUrl}`});}
function gererErreurs(err,req,res,next){console.error(err);if(err.name==="CastError")return res.status(400).json({message:"Identifiant invalide"});if(err.name==="ValidationError")return res.status(400).json({message:Object.values(err.errors).map(e=>e.message).join(", ")});res.status(err.status||500).json({message:process.env.NODE_ENV==="production"?"Erreur interne du serveur":err.message});}
module.exports={routeIntrouvable,gererErreurs};
