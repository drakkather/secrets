//jshint esversion:6

require('dotenv').config(); //Con dotenv conseguimos que todo lo que hay dentro del archivo .env este oculto y encriptado para poder usar variables de entorno
//Si queremos subir a Github deberiamos crear un .gitginore como el que yo he creado (https://github.com/github/gitignore)
const port = 3000;
const root = __dirname;
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session"); //Para poder usar variables de sesion
const fileUpload = require("express-fileupload"); //Para poder cambiar la foto de perfil
var {nanoid} = require("nanoid"); //Para generar cadenas aleatorias (se requiere de otra forma)
const arrayShuffle = require('array-shuffle'); //Para desordenar un array aleatoriamente


//Mis modulos
const passportConfig = require(root + "/js/passportConfig.js");
const fn = require(root + "/js/functions.js");
const schemaFn = require(root + "/js/schema.js");

//Variables de entorno (o configuración) gracias a dotenv
const myEncryption = process.env.MY_SECRET;
const host = process.env.DB_HOST;
const db = process.env.DB;

//Iniciamos la app con express
const app = express();


////A PARTIR DE AQUI ES MUY IMPORTANTE EL ORDEN EN EL QUE OCURREN LAS CONFIGURACIONES DE CADA PAQUETE


    /////////////////////////////////////
    //CONFIGURACION DE LA APP DE EXPRESS
    ///////////////////////////////////

app.use(fileUpload()); //Para poder cambiar la foto de perfil
app.use(express.static("public")); //Para usar la carpeta public en las rutas
app.set("view engine", "ejs"); //Para usar las vistas (o plantillas) de documentos ejs
app.use(bodyParser.urlencoded({ //Para usar bodyParser y poder recoger variables de formulario con req.body
  extended: true
}));
// Inicializamos session para poder usar req.session
app.use(session({
  secret: myEncryption,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: "auto"
  }
}));

//Conectamos a la BD con mongoose
mongoose.connect('mongodb://' + host + '/' + db, {
  useUnifiedTopology: true,
  useNewUrlParser: true
});
mongoose.set('useCreateIndex', true); //Con esto quitamos un deprecation que sale con passportLocalMongoose


//Llamo a la funcion de schema.js para crear el schema y el modelo User y tambien el modelo Secret
//Hago un return en forma de array en la funcion y los recojo como array, aunque ya como valores separados
const [User, Secret] = schemaFn.createSchemas(mongoose);


//Llamo a la funcion de passportConfig.js para configurar las diferentes autorizaciones
passport = passportConfig.config(app, User);

//Llamo a la funcion de passvalidator.js para posteriormente validar la contraseña introducida
validConfig = fn.passwordValidator();


    //////////
    //RUTAS//
    /////////

//HOME

app.get("/", function(req, res) {
  res.render("home.ejs"); //Podemos indicar la extension o no
});


//AUTORIZACIONES DE REDES SOCIALES

app.get('/auth/facebook',
  passport.authenticate('facebook'));

app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', {
    failureRedirect: '/login'
  }),
  function(req, res) {
    res.redirect('/secrets');
  });

app.get("/auth/google",
  passport.authenticate("google", {
    scope: ["profile"]
  }));

app.get("/auth/google/secrets", //Esta ruta la hemos establecido tambien en las credenciales de Google
  passport.authenticate("google", {
    failureRedirect: "/login "
  }),
  function(req, res) {
    res.redirect("/secrets");
  });

app.get('/auth/twitter',
  passport.authenticate('twitter'));

app.get('/auth/twitter/callback',
  passport.authenticate('twitter', {
    failureRedirect: '/login'
  }),
  function(req, res) {
    res.redirect('/secrets');
  });


//BORRAR CUENTA

app.post("/deleteAccount", function(req, res) {
  //Borro primero todos los secretos del usuario, luego el usuario y finalmente la imagen que tuviera el usuario
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


//BORRAR SECRETO

app.post("/deleteSecret", function(req, res) {
  //Borro un secreto concreto desde la pagina de perfil
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


//PANTALLA LOGIN

app.route("/login")
//Establecemos la página login y recogemos la variable de sesion que indicará si hay errores con el login con email del usuario marcando los input en rojo de login.ejs
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
//Autenticamos el login con email y si hay un error con el email o el password mandamos una variable de sesion al get de login para indicar que hay error
//en la contraseña o que el usuario no existe
.post(function(req, res) {
  User.findOne({username: req.body.username},function(e, foundUser){
    if(!foundUser){
      req.session.errorLog = true;
      req.session.errorLogText = "El usuario no existe";
    }
  });
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
      req.session.errorLogText = "Contraseña incorrecta";
      res.redirect("/login");
    }
  })(req, res);
});


//LOGOUT

app.get("/logout", function(req, res) {
  //Realmente la autenticación no seria necesaria ya que redirigimos siempre, pero controlamos que no surja algún error
  if (req.isAuthenticated()) {
    req.logout();
  }
  res.redirect("/");
});


//PAGINA DE PERFIL

app.get("/profile",function(req, res) {
  //Busco los secretos del usuario para listarlos y paso tambien los datos del usuario para que pueda verlos o modificarlos
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


//PAGINA DE REGISTRO

app.route("/register")
.get(function(req, res) {
  //Recojo las variables de sesion que indican si la contraseña es incorrecta o si el usuario ya existe y las mando de nuevo a register
  const errorStatusReg = req.session.errorReg;
  const errorRegText = req.session.errorRegText;
  req.session.errorReg = null;
  req.session.errorRegText = null;
  res.render("register", {
    errorStatus: errorStatusReg,
    errorText: errorRegText
  });
})
//Busco que el usuario no exista en la BD y compruebo que el email sea valido, si es asi, registro el usuario con passport
.post(function(req, res) {
  //Con passportLocalMongoose
  User.findOne({
    username: req.body.username
  }, function(e, foundUser) {
    if (foundUser === null) {
      //Compruebo que el password sea valido (número de caracteres, mayusculas, simbolos, etc) segun la configuración de passwordValidator
      if (validConfig.validate(req.body.password)) {
        //Register es una funcion de passport
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


//PAGINA DE SECRETOS

app.get("/secrets", function(req, res) {
  //Si el usuario está logueado busco todos los secretos  que no sean iguales ($ne, not equal) a null, los desordeno con array-shuffle y los envio por render
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
    //Si el usuario no está logueado, no envio los secretos pero hago que no se muestre el navbar y salga el texto por defecto
    res.render("secrets.ejs", {
      usersWithSecrets: [],
      userLog: false,
      imgProfile: null
    });
  }
});


//PAGINA PARA ENVIAR SECRETOS

app.route("/submit")
//Muestro la pagina para enviar secretos con el usuario logueado
.get(function(req, res) {
  if (req.isAuthenticated()) {
    res.render("submit.ejs", {
      userProfile: req.user
    });
  } else {
    res.redirect("/login");
  }
})
//Busco el usuario que ha enviado el secreto y lo guardo en la base de datos de Secreto y muestro la pagina de Secretos
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


//MODIFICAR PERFIL

app.post("/updateAccount", function(req, res) {
  //Compruebo que este autenticado y que haya hecho algun cambio en su imagen de perfil, porque el nombre siempre lo actualizaré, lo modifique o no
  if (req.isAuthenticated()) {
    if (req.files !== null) {
      fn.removeOldFile(req); //Elimino la imagen anterior con mi funcion
      imgFile = req.files.imageFile; //Guardo el nombre del archivo
      ext = imgFile.name.slice(-4);//Recojo la extension del archivo
      const rndString = nanoid(10); //Genera una cadena de 10 caracteres con Nanoid
      uploadPath = root + "/public/img/" + rndString + ext;
      // Uso el metodo mv del paquete express-fileUpload para copiar la imagen a mi directorio
      imgFile.mv(uploadPath, function(err) {
        if (err) {
          return res.status(500).send(err);
        } else {
          uploadPath = "/img/" + rndString + ext;
          //Guardo la ruta en la BD
          User.updateOne({
              _id: req.user._id
            }, {
              $set: req.body, //Con este parametro consigo que el resto de datos se conserven al actualizar
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
      //Si no ha cambiado la imagen solo modifico el nombre, tanto si lo ha cambiado como si no
      User.updateOne({
          _id: req.user._id
        }, {
          $set: req.body, //Con este parametro consigo que el resto de datos se conserven al actualizar
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


//ESCUCHA DEL PUERTO

app.listen(port, function() {
  console.log("Corriendo en el puerto " + port);
});
