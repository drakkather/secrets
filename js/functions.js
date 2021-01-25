// jshint esversion:6
const passwordValidator = require("password-validator");
      fs = require("fs");
      path = require("path");
      root = path.join(__dirname, "../");

exports.passwordValidator = function() {
  const validConfig = new passwordValidator();
  validConfig
    .is().min(8)
    .is().max(20)
    .has().uppercase()
    .has().lowercase()
    .has().digits()
    .has().not().spaces()
    .is().not().oneOf(["Passw0rd", "Password123", "1234"]);
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
        fs.unlinkSync(pathImg); // Elimino el archivo de imagen anterior para que no ocupe espacio
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
