//jshint esversion:6
const passwordValidator = require('password-validator'); //Para validar los caracteres insertados en el password de registro
const fs = require("fs"); //Para poder trabajar con archivos en node
const path = require("path"); //Para poder trabajar con rutas
const root = path.join(__dirname, '../'); //Vuelvo un directorio atrás para que coja bien la ruta ya que estas funciones están en una carpeta superior

exports.passwordValidator = function() {
  // Creamos la configuracion del validador de password
  var validConfig = new passwordValidator();
  // Añado las propiedades
  validConfig
    .is().min(8) // Minimum length 8
    .is().max(20) // Maximum length 100
    .has().uppercase() // Must have uppercase letters
    .has().lowercase() // Must have lowercase letters
    .has().digits() // Must have digits
    .has().not().spaces() // Should not have spaces
    .is().not().oneOf(['Passw0rd', 'Password123', '1234']); // Blacklist these values
  return validConfig;
};

exports.removeOldFile = function(req) {
  //Compruebo que la imagen no sea la imagen por defecto de la app o que sea una
  //imagen de red social, si no es el caso, la elimino del directorio
  const photoProfile = req.user.photo;
  if (req.user.photo !== "/img/defaultProfile.png") {
    if (photoProfile.slice(0, 4) === "/img") {
      const pathImg = root + "public" + photoProfile;
      try {
        fs.unlinkSync(pathImg); //Elimino el archivo de imagen anterior para que no ocupe espacio con el paquete fs
      } catch (err) {
        console.error(err);
      }
    }
  }
};
