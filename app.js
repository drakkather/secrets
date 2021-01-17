//jshint esversion:6
require('dotenv').config(); //Con dotenv conseguimos que todo lo que hay dentro del archivo .env este oculto y encriptado para poder usar variables de entorno
//Si queremos subir a Github deberiamos crear un .gitginore como el que yo he creado (https://github.com/github/gitignore)
const port = 3000;
const root = __dirname;
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
  extended: true
}));

mongoose.connect('mongodb://localhost:27017/userDB', {
  useUnifiedTopology: true,
  useNewUrlParser: true
});

const userSchema= new mongoose.Schema({
  email:{
    type:String,
    required: true
  },
  password:{
    type:String,
    required: true
  }
});

//Encriptacion del Schema con Mongoose-Encryption y Dotenv
userSchema.plugin(encrypt,{secret:process.env.MY_SECRET, encryptedFields:["password"]});


const User= new mongoose.model("user",userSchema);

app.get("/",function(req,res){
  res.render("home.ejs"); //Podemos indicar la extension o no
});

app.get("/login",function(req,res){
  res.render("login");
});

app.post("/login",function(req,res){
  User.findOne({
    email:req.body.username
  },function(e,user){
    if(e){
          console.log("Error: "+e);
    }else{
      if(user){
        if(user.password===req.body.password){
          res.render("secrets.ejs");
        }
      }
    }
  });
});

app.get("/register",function(req,res){
  res.render("register");
});

app.post("/register",function(req,res){
  const newUser= new User({
    email:req.body.username,
    password: req.body.password
  });
  newUser.save(function(e){
    if(!e){
      res.render("secrets.ejs");
    }else{
      console.log("Error: "+e);
    }
  });
});


app.listen(port, function() {
  console.log("Corriendo en el puerto "+port);
});
