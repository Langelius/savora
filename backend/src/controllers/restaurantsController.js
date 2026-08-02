const Restaurant=require("../models/Restaurant");const Plat=require("../models/Plat");
async function listerRestaurants(req,res){const filtre={actif:true};if(req.query.recherche){filtre.$or=[{nom:{$regex:req.query.recherche,$options:"i"}},{cuisine:{$regex:req.query.recherche,$options:"i"}}]}const restaurants=await Restaurant.find(filtre).sort({note:-1,nom:1});res.json({restaurants});}
async function obtenirRestaurant(req,res){const restaurant=await Restaurant.findOne({_id:req.params.id,actif:true});if(!restaurant)return res.status(404).json({message:"Restaurant introuvable"});const plats=await Plat.find({restaurantId:restaurant._id,disponible:true}).sort({populaire:-1,categorie:1,nom:1});res.json({restaurant,plats});}
module.exports={listerRestaurants,obtenirRestaurant};
