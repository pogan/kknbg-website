'use strict';

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const env = require('./env');
const users = require('../services/user.service');

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => {
  try {
    done(null, users.findById(id));
  } catch (err) {
    done(err);
  }
});

if (env.AUTH_MODE === 'google' && env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: env.GOOGLE_CALLBACK_URL,
      },
      (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails && profile.emails[0] && profile.emails[0].value;
          if (!email) return done(null, false, { message: 'Brak adresu e-mail w profilu Google.' });
          const user = users.upsertFromProfile({
            googleId: profile.id,
            email,
            name: profile.displayName,
            avatar: profile.photos && profile.photos[0] && profile.photos[0].value,
          });
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      },
    ),
  );
}

module.exports = passport;
