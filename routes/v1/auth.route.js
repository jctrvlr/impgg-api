const express = require('express');
const validate = require('express-validation');
const controller = require('../../controllers/auth.controller');
const { authorize, LOGGED_USER } = require('../../middlewares/auth');
const oAuthLogin = require('../../middlewares/auth').oAuth;
const {
  login,
  register,
  oAuth,
  refresh,
  recover,
  reset,
  resetPassword,
} = require('../../validations/auth.validation');

const router = express.Router();

/**
 * @api {post} v1/auth Login
 * @apiDescription Authenticate a user but don't return accessToken
 * @apiVersion 1.0.0
 * @apiName Auth
 * @apiGroup Auth
 * @apiPermission public
 *
 * @apiParam  {String}         email     User's email
 * @apiParam  {String{..128}}  password  User's password
 *
 * @apiSuccess  {bool}  authenticated   Boolean whether or not the user is authenticated
 *
 * @apiError (Bad Request 400)  ValidationError  Some parameters may contain invalid values
 * @apiError (Unauthorized 401)  Unauthorized     Incorrect email or password
 */
router.route('/')
  .post(authorize(LOGGED_USER), validate(login), controller.auth);

/**
 * @api {post} v1/auth/register Register
 * @apiDescription Register a new user
 * @apiVersion 1.0.0
 * @apiName Register
 * @apiGroup Auth
 * @apiPermission public
 *
 * @apiParam  {String}          email     User's email
 * @apiParam  {String{6..128}}  password  User's password
 *
 * @apiSuccess (Created 201) {String}  token.tokenType     Access Token's type
 * @apiSuccess (Created 201) {String}  token.accessToken   Authorization Token
 * @apiSuccess (Created 201) {String}  token.refreshToken  Token to get a new accessToken
 *                                                   after expiration time
 * @apiSuccess (Created 201) {Number}  token.expiresIn     Access Token's expiration time
 *                                                   in miliseconds
 * @apiSuccess (Created 201) {String}  token.timezone      The server's Timezone
 *
 * @apiSuccess (Created 201) {String}  user.id         User's id
 * @apiSuccess (Created 201) {String}  user.name       User's name
 * @apiSuccess (Created 201) {String}  user.email      User's email
 * @apiSuccess (Created 201) {String}  user.role       User's role
 * @apiSuccess (Created 201) {Date}    user.createdAt  Timestamp
 *
 * @apiError (Bad Request 400)  ValidationError  Some parameters may contain invalid values
 */
router.route('/register')
  .post(validate(register), controller.register);


/**
 * @api {post} v1/auth/login Login
 * @apiDescription Get an accessToken
 * @apiVersion 1.0.0
 * @apiName Login
 * @apiGroup Auth
 * @apiPermission public
 *
 * @apiParam  {String}         email     User's email
 * @apiParam  {String{..128}}  password  User's password
 *
 * @apiSuccess  {String}  token.tokenType     Access Token's type
 * @apiSuccess  {String}  token.accessToken   Authorization Token
 * @apiSuccess  {String}  token.refreshToken  Token to get a new accessToken
 *                                                   after expiration time
 * @apiSuccess  {Number}  token.expiresIn     Access Token's expiration time
 *                                                   in miliseconds
 *
 * @apiSuccess  {String}  user.id             User's id
 * @apiSuccess  {String}  user.name           User's name
 * @apiSuccess  {String}  user.email          User's email
 * @apiSuccess  {String}  user.role           User's role
 * @apiSuccess  {Date}    user.createdAt      Timestamp
 *
 * @apiError (Bad Request 400)  ValidationError  Some parameters may contain invalid values
 * @apiError (Unauthorized 401)  Unauthorized     Incorrect email or password
 */
router.route('/login')
  .post(validate(login), controller.login);


/**
 * @api {post} v1/auth/refresh-token Refresh Token
 * @apiDescription Refresh expired accessToken
 * @apiVersion 1.0.0
 * @apiName RefreshToken
 * @apiGroup Auth
 * @apiPermission public
 *
 * @apiParam  {String}  email         User's email
 * @apiParam  {String}  refreshToken  Refresh token aquired when user logged in
 *
 * @apiSuccess {String}  tokenType     Access Token's type
 * @apiSuccess {String}  accessToken   Authorization Token
 * @apiSuccess {String}  refreshToken  Token to get a new accessToken after expiration time
 * @apiSuccess {Number}  expiresIn     Access Token's expiration time in miliseconds
 *
 * @apiError (Bad Request 400)  ValidationError  Some parameters may contain invalid values
 * @apiError (Unauthorized 401)  Unauthorized     Incorrect email or refreshToken
 */
router.route('/refresh-token')
  .post(validate(refresh), controller.refresh);


/**
 * TODO: POST /v1/auth/reset-password
 */

/**
 * @api {post} v1/auth/recover Recover Password
 * @apiDescription Recover password
 * @apiVersion 1.0.0
 * @apiName RecoverPassword
 * @apiGroup Auth
 * @apiPermission public
 *
 * @apiParam  {String}  email         User's email
 *
 * @apiSuccess {String}  tokenType     Access Token's type
 *
 * @apiError (Bad Request 400)  ValidationError  Some parameters may contain invalid values
 * @apiError (Unauthorized 401)  Unauthorized     Incorrect email or refreshToken
 */
router.route('/recover')
  .post(validate(recover), controller.recoverPassword);

/**
 * @api {post} v1/auth/reset Reset Password
 * @apiDescription Reset password
 * @apiVersion 1.0.0
 * @apiName ResetPassword
 * @apiGroup Auth
 * @apiPermission public
 *
 * @apiParam  {String}  token         User's passwordResetToken
 *
 * @apiSuccess {String}  tokenType     Access Token's type
 *
 * @apiError (Bad Request 400)  ValidationError  Some parameters may contain invalid values
 * @apiError (Unauthorized 401)  Unauthorized     Incorrect email or refreshToken
 */
router.route('/reset/:token')
  .get(validate(reset), controller.reset);

/**
 * @api {post} v1/auth/reset-password Reset Password to new password
 * @apiDescription Reset password
 * @apiVersion 1.0.0
 * @apiName ResetPassword
 * @apiGroup Auth
 * @apiPermission public
 *
 * @apiParam  {String}  token         User's passwordResetToken
 * @apiParam  {String}  password      User's new password

 *
 * @apiSuccess {Redirect 301} 301 Redirect to link URI
 *
 * @apiError (Bad Request 400)  ValidationError  Some parameters may contain invalid values
 * @apiError (Unauthorized 401)  Unauthorized     Incorrect email or refreshToken
 */
router.route('/reset-password')
  .post(validate(resetPassword), controller.resetPassword);

/**
 * @api {post} v1/auth/facebook Facebook Login
 * @apiDescription Login with facebook. Creates a new user if it does not exist
 * @apiVersion 1.0.0
 * @apiName FacebookLogin
 * @apiGroup Auth
 * @apiPermission public
 *
 * @apiParam  {String}  access_token  Facebook's access_token
 *
 * @apiSuccess {String}  tokenType     Access Token's type
 * @apiSuccess {String}  accessToken   Authorization Token
 * @apiSuccess {String}  refreshToken  Token to get a new accessToken after expiration time
 * @apiSuccess {Number}  expiresIn     Access Token's expiration time in miliseconds
 *
 * @apiError (Bad Request 400)  ValidationError  Some parameters may contain invalid values
 * @apiError (Unauthorized 401)  Unauthorized    Incorrect access_token
 */
router.route('/facebook')
  .post(validate(oAuth), oAuthLogin('facebook'), controller.oAuth);

/**
 * @api {post} v1/auth/google Google Login
 * @apiDescription Login with google. Creates a new user if it does not exist
 * @apiVersion 1.0.0
 * @apiName GoogleLogin
 * @apiGroup Auth
 * @apiPermission public
 *
 * @apiParam  {String}  access_token  Google's access_token
 *
 * @apiSuccess {String}  tokenType     Access Token's type
 * @apiSuccess {String}  accessToken   Authorization Token
 * @apiSuccess {String}  refreshToken  Token to get a new accpessToken after expiration time
 * @apiSuccess {Number}  expiresIn     Access Token's expiration time in miliseconds
 *
 * @apiError (Bad Request 400)  ValidationError  Some parameters may contain invalid values
 * @apiError (Unauthorized 401)  Unauthorized    Incorrect access_token
 */
router.route('/google')
  .post(validate(oAuth), oAuthLogin('google'), controller.oAuth);


module.exports = router;
