// jshint esversion:6
const passwordValidator = require("password-validator"); // Para validar los caracteres insertados en el password de registro
      fs = require("fs"); // Para poder trabajar con archivos en node
      path = require("path"); // Para poder trabajar con rutas
      root = path.join(__dirname, "../"); // Vuelvo un directorio atrás para que coja bien la ruta ya que estas funciones están en una carpeta superior

exports.passwordValidator = function() {
  //  Creamos la configuracion del validador de password
  const validConfig = new passwordValidator();
  //  Añado las propiedades
  validConfig
    .is().min(8) // Minimo 8 caracteres
    .is().max(20) // Maximo 20 caracteres
    .has().uppercase() // Debe tener letras mayusculas
    .has().lowercase() // Debe tener letras minusculas
    .has().digits() // Debe tener números
    .has().not().spaces() // No debe tener espacios
    .is().not().oneOf(["Passw0rd", "Password123", "1234"]); // No se permiten estas contraseñas
  return validConfig;
};

exports.removeOldFile = function(req) {
  // Compruebo que la imagen no sea la imagen por defecto de la app o que sea una
  // imagen de red social, si no es el caso, la elimino del directorio
  const photoProfile = req.user.photo;
  if (req.user.photo !== "/img/defaultProfile.png") {
    if (photoProfile.slice(0, 4) === "/img") {
      const pathImg = root + "public" + photoProfile;
      try {
        fs.unlinkSync(pathImg); // Elimino el archivo de imagen anterior para que no ocupe espacio con el paquete fs
      } catch (err) {
        console.error(err);
      }
    }
  }
};

exports.configureServer= function(server){
  let serverData={};
  if (server === "local") {
    serverData={
      urlServer:"http://localhost:3000",
      client_ID_Google : process.env.GOOGLE_CLIENT_ID,
      client_Secret_Google : process.env.GOOGLE_CLIENT_SECRET,
      client_ID_Facebook : process.env.FACEBOOK_APP_ID,
      client_Secret_Facebook : process.env.FACEBOOK_APP_SECRET,
      client_ID_Twitter : process.env.TWITTER_CONSUMER_KEY,
      client_Secret_Twitter : process.env.TWITTER_CONSUMER_SECRET
    };
  }else{
    serverData={
      urlServer:"https://secret-bastion-70637.herokuapp.com",
      // Todas las variables de entorno hay que insertarlas en Heroku para que puedan funcionar en el servidor externo
      client_ID_Google : process.env.GOOGLE_CLIENT_ID_HEROKU,
      client_Secret_Google : process.env.GOOGLE_CLIENT_SECRET_HEROKU,
      client_ID_Facebook : process.env.FACEBOOK_APP_ID_HEROKU,
      client_Secret_Facebook : process.env.FACEBOOK_APP_SECRET_HEROKU,
      client_ID_Twitter : process.env.TWITTER_CONSUMER_KEY_HEROKU,
      client_Secret_Twitter :process.env.TWITTER_CONSUMER_SECRET_HEROKU
    };
  }
  return serverData;
};
