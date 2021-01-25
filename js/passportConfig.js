// jshint esversion:6
const GoogleStrategy = require("passport-google-oauth20").Strategy;
      FacebookStrategy = require("passport-facebook").Strategy;
      TwitterStrategy = require("passport-twitter").Strategy;
      passport = require("passport");
      fn = require(__dirname + "/functions.js");

exports.config = function(app, User, server) {
  app.use(passport.initialize());
  app.use(passport.session());
  passport.use(User.createStrategy());
  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

  //Configuro las rutas segun si el servidor es local o externo
  serverData = fn.configureServer(server);

  // Configuramos el OAuth de Google
  passport.use(new GoogleStrategy({
      clientID: serverData.client_ID_Google,
      clientSecret: serverData.client_Secret_Google,
      callbackURL: serverData.urlServer + "/auth/google/secrets",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
      profileFields: ["id", "displayName", "name", "gender", "picture.type(large)"]
    },
    function(accessToken, refreshToken, profile, cb) {
      User.findOrCreate({
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

  // Configuramos el OAuth de Facebook
  passport.use(new FacebookStrategy({
      clientID: serverData.client_ID_Facebook,
      clientSecret: serverData.client_Secret_Facebook,
      callbackURL: serverData.urlServer + "/auth/facebook/secrets",
      profileFields: ["id", "displayName", "name", "gender", "picture.type(large)"]
    },
    function(accessToken, refreshToken, profile, cb) {
      User.findOrCreate({
        facebookId: profile.id
      }, {
        username: "Facebook account",
        name: profile.displayName,
        photo: profile.photos[0].value
      }, function(err, user) {
        return cb(err, user);
      });
    }
  ));

  // Configuramos el OAuth de Twitter
  passport.use(new TwitterStrategy({
      consumerKey: serverData.client_ID_Twitter,
      consumerSecret: serverData.client_Secret_Twitter,
      callbackURL: serverData.urlServer + "/auth/twitter/callback",
      profileFields: ["id", "displayName", "name", "gender", "picture.type(large)"]
    },
    function(token, tokenSecret, profile, cb) {
      User.findOrCreate({
        twitterId: profile.id
      }, {
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
