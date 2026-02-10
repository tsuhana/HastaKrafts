const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const db = require("../models");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const full_name = profile.displayName;
        const profile_image = profile.photos[0]?.value;

        let user = await db.User.findOne({ where: { email } });

        if (user) {
          if (!user.profile_image && profile_image) {
            user.profile_image = profile_image;
            await user.save();
          }
          return done(null, user);
        }

        user = await db.User.create({
          full_name,
          email,
          password: null,
          role: "buyer",
          profile_image,
        });

        return done(null, user);
      } catch (error) {
        console.error("Google Strategy error:", error);
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.user_id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await db.User.findByPk(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;