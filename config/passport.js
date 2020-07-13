/* eslint-disable consistent-return */
/* eslint-disable no-shadow */
/* eslint-disable no-param-reassign */
const passport = require('passport');
const moment = require('moment');
const refresh = require('passport-oauth2-refresh');
const JwtStrategy = require('passport-jwt').Strategy;
const { ExtractJwt } = require('passport-jwt');
// const { Strategy: FacebookStrategy } = require('passport-facebook');
// const { Strategy: TwitterStrategy } = require('passport-twitter');
const { Strategy: TwitchStrategy } = require('@d-fischer/passport-twitch');
// const { Strategy: GitHubStrategy } = require('passport-github2');
const { OAuth2Strategy: GoogleStrategy } = require('passport-google-oauth');
// const { Strategy: LinkedInStrategy } = require('passport-linkedin-oauth2');

const {
  jwtSecret,
  env,
  baseUrl,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  TWITCH_CLIENT_ID,
  TWITCH_CLIENT_SECRET,
} = require('./vars');
const User = require('../models/user.model');
const Domain = require('../models/domain.model');

const jwtOptions = {
  secretOrKey: jwtSecret,
  jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('Bearer'),
};

const jwt = async (payload, done) => {
  try {
    const user = await User.findById(payload.sub);
    if (user) return done(null, user);
    return done(null, false);
  } catch (error) {
    return done(error, false);
  }
};

const twitchStrategyConfig = new TwitchStrategy({
  clientID: TWITCH_CLIENT_ID,
  clientSecret: TWITCH_CLIENT_SECRET,
  callbackURL: `${baseUrl}/auth/callback/twitch`,
  scope: ['user_read', 'user:read:email'],
  passReqToCallback: true,
}, (req, accessToken, refreshToken, params, profile, done) => {
  if (req.user) {
    User.findOne({ 'services.twitch': profile.id }, (err, existingUser) => {
      if (err) { return done(err); }
      if (existingUser && (existingUser.id !== req.user.id)) {
        done(err);
      } else {
        User.findById(req.user.id, (err, user) => {
          if (err) { return done(err); }
          user.services.twitch = profile.id;
          user.tokens.push({
            kind: 'twitch',
            accessToken,
            accessTokenExpires: moment().add(params.expires_in, 'seconds').format(),
            refreshToken,
          });
          user.profile.firstName = user.profile.firstName || profile.display_name;
          user.email = user.email || profile.email;
          user.profile.picture = user.profile.picture || profile.profile_image_url;
          user.save((err) => {
            done(err, user);
          });
        });
      }
    });
  } else {
    User.findOne({ 'services.twitch': profile.id }, (err, existingUser) => {
      if (err) { return done(err); }
      if (existingUser) {
        return done(null, existingUser);
      }
      User.findOne({ email: profile.email }, (err, existingEmailUser) => {
        if (err) { return done(err); }
        if (existingEmailUser) {
          if (!existingEmailUser.services.twitch) {
            existingEmailUser.services.twitch = profile.id;
            existingEmailUser.tokens.push({
              kind: 'twitch',
              accessToken,
              accessTokenExpires: moment().add(params.expires_in, 'seconds').format(),
              refreshToken,
            });
            existingEmailUser.profile.firstName = profile.display_name;
            existingEmailUser.email = profile.email;
            existingEmailUser.profile.picture = profile.profile_image_url;
            existingEmailUser.save((err) => {
              done(err, existingEmailUser);
            });
          } else {
            console.log('There is already an account using this email address. Sign in to that account and link it with Twtich manually from Account Settings.');
            done(err);
          }
        } else {
          const user = new User();
          // Add default domain
          Domain.findOne({ uri: env === 'development' ? 'localhost:3001' : 'imp.gg' }, (err, domain) => {
            user.domains.push(domain._id);
            user.email = profile.email;
            user.services.twitch = profile.id;
            user.tokens.push({
              kind: 'twitch',
              accessToken,
              accessTokenExpires: moment().add(params.expires_in, 'seconds').format(),
              refreshToken,
            });
            user.profile.firstName = profile.display_name;
            user.email = profile.email;
            user.profile.picture = profile.profile_image_url;
            user.save((err) => {
              done(err, user);
            });
          });
        }
      });
    });
  }
});

passport.use(twitchStrategyConfig);
refresh.use('twitch', twitchStrategyConfig);

passport.use(new GoogleStrategy({
  clientID: GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_CLIENT_SECRET,
  callbackURL: `${baseUrl}/v1/auth/google/callback`,
},
((accessToken, refreshToken, profile, done) => {
  // console.log(accessToken, refreshToken, profile)
  console.log('GOOGLE BASED OAUTH VALIDATION GETTING CALLED');
  return done(null, profile);
})));
/*
passport.use(new FacebookStrategy({
  clientID: FACEBOOK_CLIENT_ID,
  clientSecret: FACEBOOK_CLIENT_SECRET,
  callbackURL: 'http://localhost:3001/facebook/callback',
  profileFields: ['id', 'displayName', 'email', 'picture'],
},
((accessToken, refreshToken, profile, done) => {
  console.log(profile);
  console.log('FACEBOOK BASED OAUTH VALIDATION GETTING CALLED');
  return done(null, profile);
})));
*/
// These functions are required for getting data To/from JSON returned from Providers
passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((obj, done) => {
  done(null, obj);
});

exports.jwt = new JwtStrategy(jwtOptions, jwt);
