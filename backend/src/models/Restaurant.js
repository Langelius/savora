const mongoose = require("mongoose");
const schemaRestaurant = new mongoose.Schema({
  nom:{type:String,required:true,trim:true}, cuisine:{type:String,required:true,trim:true}, description:{type:String,default:""}, image:{type:String,required:true}, note:{type:Number,min:0,max:5,default:0}, delai:{type:String,default:"25–35 min"}, fraisLivraison:{type:Number,min:0,default:0}, actif:{type:Boolean,default:true}
},{timestamps:true});
module.exports=mongoose.model("Restaurant",schemaRestaurant);
