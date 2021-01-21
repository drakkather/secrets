//jshint esversion:6
const GoogleStrategy = require('passport-google-oauth20').Strategy; //Para usar el OAuth de Google
const FacebookStrategy = require('passport-facebook').Strategy; //Para usar el OAuth de Facebook
const TwitterStrategy = require('passport-twitter').Strategy; //Para usar el OAuth de Facebook
const passport = require("passport");


exports.config = function(app, User) {
  //Iniciamos passport
  app.use(passport.initialize());
  app.use(passport.session());
  //Configuramos passportLocalMongoose
  passport.use(User.createStrategy());
  passport.serializeUser(function(user, done) { //Con esta funcion passport puede crear la cookie (lo hace automaticamente)
    done(null, user.id);
  });
  passport.deserializeUser(function(id, done) { //Con esta funcion passport puede eliminar la cookie (lo hace automaticamente)
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

  //Configuramos el OAuth de Google
  passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID, //El clientID se obtiene al crear las credenciales en Google
      clientSecret: process.env.GOOGLE_CLIENT_SECRET, //El clientSecret se obtiene al crear las credenciales en Google
      callbackURL: "http://localhost:3000/auth/google/secrets", //Esta ruta la hemos configurado en las credenciales de Google en la URI de redireccionamiento autorizados
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo", //Este es propio del paquete
      profileFields: ['id', 'displayName', 'name', 'gender', 'picture.type(large)'] //Este es propio del paquete
    },
    function(accessToken, refreshToken, profile, cb) {
      User.findOrCreate({ //Busca por id y si no existe crea el id y tambien name y photo, esta funcion no viene por defecto, ha sido agregada a la app
        googleId: profile.id
      }, {
        username: "Google account",
        name: profile.displayName,
        photo: profile.photos[0].value
      }, function(err, user) {
        return cb(err, user);
      });
    }
  ));

  //Configuramos el OAuth de Facebook
  passport.use(new FacebookStrategy({
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: "http://localhost:3000/auth/facebook/secrets",
      profileFields: ['id', 'displayName', 'name', 'gender', 'picture.type(large)']
    },
    function(accessToken, refreshToken, profile, cb) {
      User.findOrCreate({
        facebookId: profile.id}, {
          username: "Facebook account",
          name: profile.displayName,
          photo: profile.photos[0].value
      }, function(err, user) {
        return cb(err, user);
      });
    }
  ));

  //Configuramos el OAuth de Twitter
  passport.use(new TwitterStrategy({
      consumerKey: process.env.TWITTER_CONSUMER_KEY,
      consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
      callbackURL: "http://localhost:3000/auth/twitter/callback",
      profileFields: ['id', 'displayName', 'name', 'gender', 'picture.type(large)']
    },
    function(token, tokenSecret, profile, cb) {
      User.findOrCreate({
        twitterId: profile.id}, {
          username: "Twitter account",
          name: profile.displayName,
          photo: profile.photos[0].value
      }, function(err, user) {
        return cb(err, user);
      });
    }
  ));
  return passport;
};
