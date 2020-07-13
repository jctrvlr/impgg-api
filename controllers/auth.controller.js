const httpStatus = require('http-status');
const moment = require('moment-timezone');
const sgMail = require('@sendgrid/mail');

const User = require('../models/user.model');
const RefreshToken = require('../models/refreshToken.model');
const { jwtExpirationInterval } = require('../config/vars');
const Domain = require('../models/domain.model');
const {
  env, SENDGRID_API_KEY, fromEmail, baseUrl,
} = require('../config/vars');

sgMail.setApiKey(SENDGRID_API_KEY);

/**
* Returns a formated object with tokens
* @private
*/
function generateTokenResponse(user, accessToken) {
  const tokenType = 'Bearer';
  const refreshToken = RefreshToken.generate(user).token;
  const expiresIn = moment().add(jwtExpirationInterval, 'minutes');
  return {
    tokenType, accessToken, refreshToken, expiresIn,
  };
}

/**
 * Returns jwt token if registration was successful
 * @public
 */
exports.register = async (req, res, next) => {
  try {
    const user = new User(req.body);
    // Add default domain
    const domain = await Domain.findOne({ uri: env === 'development' ? 'localhost:3001' : 'imp.gg' });
    user.domains.push(domain._id);

    const savedUser = await user.save();

    const userTransformed = await User.findOne({ _id: savedUser._id }).populate('domains');
    const token = generateTokenResponse(savedUser, savedUser.token());
    res.status(httpStatus.CREATED);
    return res.json({ token, user: userTransformed });
  } catch (error) {
    return next(User.checkDuplicateEmail(error));
  }
};

/**
 * Returns jwt token if valid username and password is provided
 * @public
 */
exports.login = async (req, res, next) => {
  try {
    const { user, accessToken } = await User.findAndGenerateToken(req.body);
    const token = generateTokenResponse(user, accessToken);
    const userTransformed = await User.findOne({ _id: user._id }).select('+password').populate('domains');

    return res.json({ token, user: userTransformed });
  } catch (error) {
    return next(error);
  }
};

/**
 * Returns jwt token if valid username and password is provided
 * @public
 */
exports.auth = async (req, res, next) => {
  try {
    return User.authUser(req.body, req.user)
      .then((authenticated) => {
        res.status(httpStatus.OK);
        res.json(authenticated);
      })
      .catch(err => next(err));
  } catch (error) {
    return next(error);
  }
};

/**
 * login with an existing user or creates a new one if valid accessToken token
 * Returns jwt token
 * @public
 */
exports.oAuth = async (req, res, next) => {
  try {
    const { user } = req;
    const accessToken = user.token();
    const token = generateTokenResponse(user, accessToken);
    const userTransformed = await User.findOne({ _id: user._id }).populate('domains');
    return res.json({ token, user: userTransformed });
  } catch (error) {
    return next(error);
  }
};

exports.facebook = async (req, res, next) => {
  try {
    const { user } = req;
    const _user = new User({
      email: user.email,
    });
    // Add default domain
    const domain = await Domain.findOne({ uri: env === 'development' ? 'localhost:3001' : 'imp.gg' });
    _user.domains.push(domain._id);

    const savedUser = await _user.save();

    const userTransformed = await User.findOne({ _id: savedUser._id }).populate('domains');
    const token = generateTokenResponse(savedUser, savedUser.token());
    res.status(httpStatus.CREATED);
    return res.json({ token, user: userTransformed });
  } catch (error) {
    return next(error);
  }
};

exports.google = async (req, res, next) => {
  try {
    const { user } = req;
    const withEmail = await User.find({ email: user.email });
    const withId = await User.find({ 'services.google': user.id });
    // If both email and ID found and same account then generate token and return
    // If both found but different accounts return error
    // If only withEmail found then add ID to it then generate token and return
    // If only withId found then add email to it then generate token and return
    // If neither found then create new account with provided info then generate token and return

    if (withEmail && withId && (withEmail._id === withId._id)) {
      // Generate token and return
      const userTransformed = await User.findOne({ _id: withEmail._id }).populate('domains');
      const token = generateTokenResponse(withEmail, withEmail.token());
      res.status(httpStatus.OK);
      return res.json({ token, user: userTransformed });
    } if (withEmail && withId && withEmail._id !== withId._id) {
      // return error
      return res.status(500).json({ message: 'You have already linked your Google account with a different ImpGG account.' });
    } if (withEmail && !withId) {
      // Add ID to withEmail then generate token and return
      withEmail.services.google = user.id;
      const savedUser = await withEmail.save();

      const userTransformed = await User.findOne({ _id: savedUser._id }).populate('domains');
      const token = generateTokenResponse(savedUser, savedUser.token());
      res.status(httpStatus.CREATED);
      return res.json({ token, user: userTransformed });
    } if (withId && !withEmail) {
      // Add email to withId and generate token and return
      // Add ID to withEmail then generate token and return
      withId.email = user._json.email;
      const savedUser = await withEmail.save();

      const userTransformed = await User.findOne({ _id: savedUser._id }).populate('domains');
      const token = generateTokenResponse(savedUser, savedUser.token());
      res.status(httpStatus.CREATED);
      return res.json({ token, user: userTransformed });
    }
    const _user = new User({
      email: user.email,
    });
      // Add default domain
    const domain = await Domain.findOne({ uri: env === 'development' ? 'localhost:3001' : 'imp.gg' });
    _user.domains.push(domain._id);

    const savedUser = await _user.save();

    const userTransformed = await User.findOne({ _id: savedUser._id }).populate('domains');
    const token = generateTokenResponse(savedUser, savedUser.token());
    res.status(httpStatus.CREATED);
    return res.json({ token, user: userTransformed });
  } catch (error) {
    return next(error);
  }
};

exports.twitch = async (req, res, next) => {
  try {
    const { user } = req;

    const userTransformed = await User.findOne({ _id: user._id }).populate('domains');
    const token = generateTokenResponse(user, user.token());
    res.status(httpStatus.OK);

    res.header('Content-Type', 'application/json');
    res.header('Access-Control-Allow-Origin', ['*']);

    return res.json({ token, user: userTransformed });
  } catch (error) {
    return next(error);
  }
};

/**
 * Returns a new jwt when given a valid refresh token
 * @public
 */
exports.refresh = async (req, res, next) => {
  try {
    const { email, refreshToken } = req.body;
    const refreshObject = await RefreshToken.findOneAndRemove({
      userEmail: email,
      token: refreshToken,
    });
    const { user, accessToken } = await User.findAndGenerateToken({ email, refreshObject });
    const response = generateTokenResponse(user, accessToken);
    return res.json(response);
  } catch (error) {
    return next(error);
  }
};

/**
 * Returns jwt token if valid username and password is provided
 * @public
 */
exports.recoverPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    return User.findOne({ email }, {
      email: 1, profile: 1, passwordResetToken: 1, passwordResetExpires: 1,
    })
      .then((user) => {
        if (!user) return res.status(200).json({ message: 'A reset email has been sent if the email address you provided exists.' });

        // Generate and set password reset token/expire
        user.generatePasswordReset();

        // Save updated user object
        return user.save()
          .then((_user) => {
            // Send email
            console.log(_user);
            const link = `http://${req.headers.host}/v1/auth/reset/${_user.passwordResetToken}`;
            const mailOptions = {
              to: _user.email,
              from: fromEmail,
              subject: 'Password change request',
              text: `Hi ${_user.profile.firstName} \n 
            Please click on the following link ${link} to reset your password. \n\n 
            If you did not request this, please ignore this email and your password will remain unchanged.\n`,
            };
            // eslint-disable-next-line no-unused-vars
            return sgMail.send(mailOptions, (error, _result) => {
              if (error) return res.status(500).json({ message: error.message });

              return res.status(200).json({ message: `A reset email has been sent to ${user.email}.` });
            });
          })
          .catch((err) => {
            console.log(err);
            return res.status(500).json({ message: err.message });
          });
      }).catch(err => res.status(500).json({ message: err.message }));
  } catch (error) {
    return next(error);
  }
};

/**
 * Returns jwt token if valid username and password is provided
 * @public
 */
exports.reset = async (req, res, next) => {
  try {
    return User.findOne({
      passwordResetToken: req.params.token,
      passwordResetExpires: { $gt: Date.now() },
    }, {
      email: 1, profile: 1, passwordResetToken: 1, passwordResetExpires: 1,
    })
      .then((user) => {
        if (!user) return res.status(401).json({ message: 'Password reset token is invalid or has expired.' });
        // Redirect user to form with the email address
        return res.redirect(302, `${baseUrl}/password/reset?tok=${user.passwordResetToken}`);
      })
      .catch(err => res.status(500).json({ message: err.message }));
  } catch (error) {
    return next(error);
  }
};

/**
 * Saves new password.
 * @public
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    return User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() },
    }, {
      email: 1, profile: 1, passwordResetToken: 1, passwordResetExpires: 1,
    }).then((user) => {
      // eslint-disable-next-line no-param-reassign
      user.password = password;
      return user.save()
        .then(() => res.status(httpStatus.OK).json({ message: 'Password is saved' }))
        .catch(e => next(User.checkDuplicateEmail(e)));
    });
  } catch (error) {
    return next(error);
  }
};
