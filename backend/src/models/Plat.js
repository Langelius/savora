const mongoose=require("mongoose");
const schemaPlat=new mongoose.Schema({restaurantId:{type:mongoose.Schema.Types.ObjectId,ref:"Restaurant",required:true,index:true},nom:{type:String,required:true,trim:true},description:{type:String,default:""},prix:{type:Number,required:true,min:0},categorie:{type:String,required:true},image:{type:String,required:true},populaire:{type:Boolean,default:false},disponible:{type:Boolean,default:true}},{timestamps:true});
module.exports=mongoose.model("Plat",schemaPlat);
