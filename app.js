// jshint esversion:6

require("dotenv").config();
const port = process.env.PORT || 3000;
      root = __dirname;
      express = require("express");
      bodyParser = require("body-parser");
      ejs = require("ejs");
      mongoose = require("mongoose");
      session = require("express-session");
      fileUpload = require("express-fileupload");
      arrayShuffle = require("array-shuffle");
      server = "local"; //Si establezco el string en "local" funciona en localhost, si no en Heroku
var {nanoid} = require("nanoid");

// Mis modulos
const passportConfig = require(root + "/js/passportConfig.js");
      fn = require(root + "/js/functions.js");
      schemaFn = require(root + "/js/schema.js");

// Variables de entorno
const myEncryption = process.env.MY_SECRET;
      host = process.env.DB_HOST;
      db = process.env.DB;
      dbUserAtlas=process.env.DB_USER_ATLAS;
      dbPassAtlas=process.env.DB_PASS_ATLAS;
      dbClusterAtlas=process.env.DB_CLUSTER_ATLAS;


const app = express();


    // // // // // // // // // // // // // // // // // // /
    // CONFIGURACION DE LA APP DE EXPRESS
    // // // // // // // // // // // // // // // // // /

app.use(fileUpload()); // Para poder cambiar la foto de perfil
app.use(express.static("public")); // Para usar la carpeta public en las rutas
app.set("view engine", "ejs"); // Para usar las vistas (o plantillas) de documentos ejs
app.use(bodyParser.urlencoded({ // Para usar bodyParser y poder recoger variables de formulario con req.body
  extended: true
}));

app.use(session({
  secret: myEncryption,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: "auto"
  }
}));

if(server==="local"){
  // Conectamos a la BD con mongoose
  mongoose.connect("mongodb://" + host + "/" + db, {
    useUnifiedTopology: true,
    useNewUrlParser: true
  });
}else{
  // Conectamos la BD con Mongo Atlas
  mongoose.connect("mongodb+srv://"+dbUserAtlas+":"+dbPassAtlas+dbClusterAtlas+"/"+db+"?retryWrites=true&w=majority", { // Conecto a la base de datos, si no existe, la crea cuando insertemos un documento
    useUnifiedTopology: true,
    useNewUrlParser: true
  });
}

mongoose.set("useCreateIndex", true);


// Llamo a la funcion de schema.js para crear el schema y el modelo User y tambien el modelo Secret
const [User, Secret] = schemaFn.createSchemas(mongoose);


// Llamo a la funcion de passportConfig.js para configurar las diferentes autorizaciones
passport = passportConfig.config(app, User, server);

// Llamo a la funcion de passvalidator.js para posteriormente validar la contraseña introducida
validConfig = fn.passwordValidator();


    // // // // //
    // RUTAS//
    // // // // /


// HOME

app.get("/", function(req, res) {
  res.render("home.ejs");
});


// AUTORIZACIONES DE REDES SOCIALES

app.get("/auth/facebook",
  passport.authenticate("facebook"));

app.get("/auth/facebook/secrets",
  passport.authenticate("facebook", {
    failureRedirect: "/login"
  }),
  function(req, res) {
    res.redirect("/secrets");
  });

app.get("/auth/google",
  passport.authenticate("google", {
    scope: ["profile"]
  }));

app.get("/auth/google/secrets",
  passport.authenticate("google", {
    failureRedirect: "/login "
  }),
  function(req, res) {
    res.redirect("/secrets");
  });

app.get("/auth/twitter",
  passport.authenticate("twitter"));

app.get("/auth/twitter/callback",
  passport.authenticate("twitter", {
    failureRedirect: "/login"
  }),
  function(req, res) {
    res.redirect("/secrets");
  });


// BORRAR CUENTA

app.post("/deleteAccount", function(req, res) {
  // Borro primero todos los secretos del usuario, luego el usuario y finalmente la imagen que tuviera el usuario
  if (req.isAuthenticated()) {
    Secret.deleteMany({
      "user._id": req.user._id
    }, function(err) {
      if (!err) {
        User.findByIdAndDelete(req.body.userId, function(error) {
          if (!error) {
            fn.removeOldFile(req);
            res.redirect("/");
          }
        });
      }
    });
  } else {
    res.redirect("/");
  }
});


// BORRAR SECRETO

app.post("/deleteSecret", function(req, res) {
  // Borro un secreto concreto desde la pagina de perfil
  if (req.isAuthenticated()) {
    Secret.findByIdAndDelete(req.body.secretId, function(e) {
      if (!e) {
        res.redirect("/profile");
      }
    });
  } else {
    res.redirect("/");
  }
});


// PANTALLA LOGIN

app.route("/login")
// Establecemos la página login y recogemos la variable de sesion que indicará si hay errores con el login con email del usuario marcando los input en rojo de login.ejs
.get(function(req, res) {
  const errorStatusLog = req.session.errorLog;
  const errorLogText = req.session.errorLogText;
  req.session.errorLog = null;
  req.session.errorLogText = null;
  res.render("login", {
    errorStatus: errorStatusLog,
    errorText: errorLogText
  });
})
// Autenticamos el login con email y si hay un error con el email o el password mandamos una variable de sesion al get de login para indicar que hay error
// en la contraseña o que el usuario no existe
.post(function(req, res) {
  User.findOne({username: req.body.username},function(e, foundUser){
    if(!foundUser){
      req.session.errorLog = true;
      req.session.errorLogText = "El usuario no existe";
      res.redirect("/login");
    }else{
      passport.authenticate("local", function(err, user, info) {
        if (user) {
          req.login(user, function(err) {
            if (!err) {
              res.redirect("/secrets");
            } else {
              res.redirect("/login");
            }
          });
        } else {
          req.session.errorLog = true;
          req.session.errorLogText = "Contraseña incorrecta";
          res.redirect("/login");
        }
      })(req, res);
    }
  });
});


// LOGOUT

app.get("/logout", function(req, res) {
  if (req.isAuthenticated()) {
    req.logout();
  }
  res.redirect("/");
});


// PAGINA DE PERFIL

app.get("/profile",function(req, res) {
  // Busco los secretos del usuario para listarlos y paso tambien los datos del usuario para que pueda verlos o modificarlos
  if (req.isAuthenticated()) {
    Secret.find({
      "user._id": req.user._id
    }, function(e, secretsFound) {
      res.render("profile.ejs", {
        userProfile: req.user,
        secrets: secretsFound
      });
    });
  } else {
    res.redirect("/login");
  }
});


// PAGINA DE REGISTRO

app.route("/register")
.get(function(req, res) {
  // Recojo las variables de sesion que indican si la contraseña es incorrecta o si el usuario ya existe y las mando de nuevo a register
  const errorStatusReg = req.session.errorReg;
  const errorRegText = req.session.errorRegText;
  req.session.errorReg = null;
  req.session.errorRegText = null;
  res.render("register", {
    errorStatus: errorStatusReg,
    errorText: errorRegText
  });
})
// Busco que el usuario no exista en la BD y compruebo que el email sea valido, si es asi, registro el usuario con passport
.post(function(req, res) {
  User.findOne({
    username: req.body.username
  }, function(e, foundUser) {
    if (foundUser === null) {
      // Compruebo que el password sea valido (número de caracteres, mayusculas, simbolos, etc) segun la configuración de passwordValidator
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


// PAGINA DE SECRETOS

app.get("/secrets", function(req, res) {
  // Si el usuario está logueado busco todos los secretos, los desordeno con array-shuffle y los envio
  if (req.isAuthenticated()) {
    Secret.find({
      secret: {
        $ne: null
      }
    }, function(e, foundSecrets) {
      if (e) {
        console.log(e);
      } else {
        if (foundSecrets) {
          const shuffledSecrets = arrayShuffle(foundSecrets);
          res.render("secrets.ejs", {
            usersWithSecrets: shuffledSecrets,
            userLog: true,
            userProfile: req.user
          });
        }
      }
    });
  } else {
    // Si el usuario no está logueado, no envio los secretos pero hago que no se muestre el navbar y salga el texto por defecto
    res.render("secrets.ejs", {
      usersWithSecrets: [],
      userLog: false,
      imgProfile: null
    });
  }
});


// PAGINA PARA ENVIAR SECRETOS

app.route("/submit")
// Muestro la pagina para enviar secretos con el usuario logueado
.get(function(req, res) {
  if (req.isAuthenticated()) {
    res.render("submit.ejs", {
      userProfile: req.user
    });
  } else {
    res.redirect("/login");
  }
})
// Busco el usuario que ha enviado el secreto y lo guardo en la base de datos de Secreto y muestro la pagina de Secretos
.post(function(req, res) {
  User.findById(req.user._id, function(e, foundUser) {
    if (e) {
      console.log(e);
    } else {
      if (foundUser) {
        const newSecret = new Secret({
          user: foundUser,
          secret: req.body.secret
        });
        newSecret.save(function() {
          res.redirect("/secrets");
        });
      }
    }
  });
});


// MODIFICAR PERFIL

app.post("/updateAccount", function(req, res) {
  // Compruebo que este autenticado y que haya hecho algun cambio en su imagen de perfil, porque el nombre siempre lo actualizaré, lo modifique o no
  if (req.isAuthenticated()) {
    if (req.files !== null) {
      fn.removeOldFile(req); // Elimino la imagen anterior con mi funcion
      imgFile = req.files.imageFile;
      ext = imgFile.name.slice(-4);
      const rndString = nanoid(10); // Genera una cadena de 10 caracteres con Nanoid
      uploadPath = root + "/public/img/" + rndString + ext;
      // Copia la imagen a mi directorio
      imgFile.mv(uploadPath, function(err) {
        if (err) {
          return res.status(500).send(err);
        } else {
          uploadPath = "/img/" + rndString + ext;
          // Guardo la ruta en la BD
          User.updateOne({
              _id: req.user._id
            }, {
              $set: req.body,
              name: req.body.userNameInput,
              photo: uploadPath
            },
            function(e) {
              if (!e) {
                res.redirect("/profile");
              }
            });
        }
      });
    } else {
      // Si no ha cambiado la imagen solo modifico el nombre, tanto si lo ha cambiado como si no
      User.updateOne({
          _id: req.user._id
        }, {
          $set: req.body,
          name: req.body.userNameInput,
        },
        function(e) {
          if (!e) {
            res.redirect("/profile");
          }
        });
    }
  } else {
    res.redirect("/login");
  }
});


// ESCUCHA DEL PUERTO

app.listen(port, function() {
  if(server==="local"){
    console.log("Corriendo en el puerto " + port);
  }else{
    console.log("Corriendo en el cluster de MongoDB Atlas");
  }
});
