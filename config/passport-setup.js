const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/user");

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, foundUser) {
        if (err) {
            console.log(err);
        } else {
            done(null, foundUser);
        }
    });
});

passport.use(
    new GoogleStrategy({
        // options for google strategy
        clientID: process.env.clientID,
        clientSecret: process.env.clientSecret,
        callbackURL: '/auth/google/redirect'
    }, (accessToken, refreshToken, profile, done) => {
        // check if user already exists in our own db
        User.findOne({ googleId: profile.id }).then((currentUser) => {
            if (currentUser) {
                // already have this user
                console.log('Nuovo login: ', currentUser.username);
                done(null, currentUser);
            } else {
                // Utente da registrare
                var user = new User({
                    googleId: profile.id,
                    datiGoogle: {
                        nome: profile.name.givenName,
                        cognome: profile.name.familyName,
                        email: profile.emails[0].value,
                        username: profile.displayName,
                        immagine: profile.photos[0].value
                    },
                    nome: profile.name.givenName,
                    cognome: profile.name.familyName,
                    email: profile.emails[0].value,
                    username: profile.displayName,
                    immagine: {
                        // tipo: "local" / "url" / "none"
                        tipo: "url",
                        indirizzo: profile.photos[0].value
                    },
                });
                user.save().then((newUser) => {
                    console.log('Nuova registrazione: ', newUser.username);
                    done(null, newUser);
                });
            }
        });
    })
);