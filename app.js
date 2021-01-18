//jshint esversion:6
require('dotenv').config(); //Con dotenv conseguimos que todo lo que hay dentro del archivo .env este oculto y encriptado para poder usar variables de entorno
//Si queremos subir a Github deberiamos crear un .gitginore como el que yo he creado (https://github.com/github/gitignore)
const port = 3000;
const root = __dirname;
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose"); //Para usar este paquete necesitamos instalar tambien por npm el paquete "passport-local" aunque no lo requiramos
const passwordValidator = require('password-validator'); //Para validar los caracteres insertados en el password de registro

const myEncryption = process.env.MY_SECRET; //Variables de entorno (o configuración) gracias a dotenv
const host = process.env.DB_HOST;
const db = process.env.DB;

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
  extended: true
}));



//Inicializamos session y passport
app.use(session({
  secret: myEncryption,
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());



mongoose.connect('mongodb://' + host + '/' + db, {
  useUnifiedTopology: true,
  useNewUrlParser: true
});
mongoose.set('useCreateIndex', true); //Con esto quitamos un deprecation que sale con passportLocalMongoose

const userSchema = new mongoose.Schema({
  email: {
    type: String //Con passportLocalMongoose hay que quitar el parametro require: true porque da error
  },
  password: {
    type: String
  }
});

//Añadimos passportLocalMongoose a nuestro Schema
userSchema.plugin(passportLocalMongoose);


const User = new mongoose.model("user", userSchema);

//Configuramos passportLocalMongoose
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



// Creamos la configuracion del validador de password
var validConfig = new passwordValidator();
// Add properties to it
validConfig
  .is().min(8) // Minimum length 8
  .is().max(20) // Maximum length 100
  .has().uppercase() // Must have uppercase letters
  .has().lowercase() // Must have lowercase letters
  .has().digits() // Must have digits
  .has().not().spaces() // Should not have spaces
  .is().not().oneOf(['Passw0rd', 'Password123', '1234']); // Blacklist these values



app.get("/", function(req, res) {
  res.render("home.ejs"); //Podemos indicar la extension o no
});

app.get("/login", function(req, res) {
  const errorStatusLog = req.session.errorLog; //recogemos la variable de sesion
  req.session.errorLog = null; // reseteamos la variable de sesión
  res.render("login", {
    errorStatus: errorStatusLog
  });
});


app.post("/login", function(req, res) {
  passport.authenticate('local', function(err, user, info) {
    if (user) {
      req.login(user, function(err) {
        if (!err) {
          res.redirect('/secrets');
        } else {
          res.redirect("/login");
        }
      });
    } else {
      req.session.errorLog = true; //mandamos una variable de sesion a true para recoger que hay un error en el log
      res.redirect("/login");
    }
  })(req, res);
});

app.get("/logout", function(req, res) {
  req.logout();
  res.redirect("/");
});

app.get("/register", function(req, res) {
  const errorStatusReg = req.session.errorReg;
  const errorRegText = req.session.errorRegText;
  req.session.errorReg = null;
  req.session.errorRegText = null;
  res.render("register", {
    errorStatus: errorStatusReg,
    errorText: errorRegText
  });
});

app.post("/register", function(req, res) {
  //Con passportLocalMongoose
  User.findOne({
    username: req.body.username
  }, function(e, foundUser) {
    if (foundUser===null) {
      if (validConfig.validate(req.body.password)) {
        User.register({
          username: req.body.username
        }, req.body.password, function(err, user) {
          if (!err) {
            passport.authenticate("local")(req, res, function() {
              res.redirect("/secrets");
            });
          }
        });
      } else {
        req.session.errorReg = true;
        req.session.errorRegText = "La contraseña no es válida";
        res.redirect("/register");
      }
    } else {
      req.session.errorReg = true;
      req.session.errorRegText = "El usuario ya existe";
      res.redirect("/register");
    }
  });

});

app.get("/secrets", function(req, res) {
  if (req.isAuthenticated()) {
    res.render("secrets.ejs");
  } else {
    res.redirect("/login");
  }
});


app.listen(port, function() {
  console.log("Corriendo en el puerto " + port);
});
