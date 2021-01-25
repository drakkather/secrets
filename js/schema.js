// jshint esversion:6
const findOrCreate = require("mongoose-findorcreate");
      passportLocalMongoose = require("passport-local-mongoose");

exports.createSchemas = function(mongoose) {
  // Creo primero el schema de usuarios, le añado los plugin, creo el modelo y
  //luego creo el schema de secret vinculado al de usuario y creo su modelo
  const userSchema = new mongoose.Schema({
    username: {
      type: String
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

  // Añadimos passportLocalMongoose a nuestro Schema
  userSchema.plugin(passportLocalMongoose);

  // Añadimos findOrCreate a nuestro Schema
  userSchema.plugin(findOrCreate);

  const User = new mongoose.model("user", userSchema);

  const secretSchema = new mongoose.Schema({
    user: userSchema,
    secret: String
  });

  const Secret = new mongoose.model("secret", secretSchema);
  return [User, Secret];
};
