//jshint esversion:6
const findOrCreate = require('mongoose-findorcreate'); //Para poder usar la funcion findOrCreate que usan las estrategias de passport oauth
const passportLocalMongoose = require("passport-local-mongoose"); //Para usar este paquete necesitamos instalar tambien por npm el paquete "passport-local" aunque no lo requiramos

exports.createSchemas = function(mongoose) {
  //Creo primero el schema de usuarios, le añado los plugin, creo el modelo y luego creo el schema de secret vinculado al de usuario y creo su modelo
  const userSchema = new mongoose.Schema({
    username: {
      type: String //Con passportLocalMongoose hay que quitar el parametro require: true porque da error
    },
    password: {
      type: String
    },
    googleId: {
      type: String
    },
    facebookId: {
      type: String
    },
    twitterId: {
      type: String
    },
    name: {
      type: String
    },
    photo: {
      type: String,
      default: "/img/defaultProfile.png"
    }
  });

  //Añadimos passportLocalMongoose a nuestro Schema
  userSchema.plugin(passportLocalMongoose);

  //Añadimos findOrCreate a nuestro Schema
  userSchema.plugin(findOrCreate);

  const User = new mongoose.model("user", userSchema);

  const secretSchema = new mongoose.Schema({
    user: userSchema, //Lo vinculo al schema de User
    secret: String
  });

  const Secret = new mongoose.model("secret", secretSchema);
  return [User, Secret];
};
