const express = require('express');
const validate = require('express-validation');
const controller = require('../../controllers/link.controller');
const { authorize, LOGGED_USER } = require('../../middlewares/auth');
const {
  createLink,
  getLinkInfo,
  updateLink,
  checkSlink,
  archiveLink,
} = require('../../validations/link.validation');

const router = express.Router();

router
  .route('/link/:linkId')
  /**
   * @api {get} v1/link Get link info
   * @apiDescription Get a link's info
   * @apiVersion 1.0.0
   * @apiName Get Link
   * @apiGroup Link
   * @apiPermission public
   *
   * @apiHeader {String} Authorization   User's access token
   *
   * @apiParam {String}    [linkId]    linkId
   *
   * @apiSuccess (OK 200) {String} creatorId
   * @apiSuccess (OK 200) {String} url
   * @apiSuccess (OK 200) {String} type
   * @apiSuccess (OK 200) {String} shortLink
   *
   * @apiError (Bad Request 400)  ValidationError Some parameters may contain invalid values
   */
  .get(authorize(LOGGED_USER), validate(getLinkInfo), controller.getLink);

router
  .route('/slink')
  /**
   * @api {post} v1/slink Check for shortlink duplicate
   * @apiDescription Check for shortlink duplicate
   * @apiVersion 1.0.0
   * @apiName Check shortlink
   * @apiGroup Link
   * @apiPermission public
   *
   * @apiHeader {String} Authorization   User's access token
   *
   * @apiParam {String}    [sLink]    sLink
   *
   * @apiSuccess (OK 200) {Boolean} checkDup
   */
  .post(authorize(LOGGED_USER), validate(checkSlink), controller.checkShortLink);

router
  .route('/archive')
  /**
   * @api {post} v1/archive Archive link
   * @apiDescription Archive link
   * @apiVersion 1.0.0
   * @apiName Archive link
   * @apiGroup Link
   * @apiPermission public
   *
   * @apiHeader {String} Authorization   User's access token
   *
   * @apiParam {String}    [linkId]    sLink
   *
   * @apiSuccess (OK 200) {Object} User
   */
  .post(authorize(LOGGED_USER), validate(archiveLink), controller.archiveLink);

router
  .route('/')
  /**
   * @api {post} v1/link Create Link
   * @apiDescription Create a new link
   * @apiVersion 1.0.0
   * @apiName CreateLink
   * @apiGroup Link
   * @apiPermission public
   *
   * @apiHeader {String} Authorization   User's access token
   *
   * @apiParam {String}    [CreatorId]        CreatorId
   * @apiParam {String}    [uri]       uri
   * @apiParam {String}    [sLink] custom shortLink {OPTIONAL}
   *
   * @apiSuccess (Created 201) {String} creatorId
   * @apiSuccess (Created 201) {String} url
   * @apiSuccess (Created 201) {String} type
   * @apiSuccess (Created 201) {String} shortLink
   *
   * @apiError (Bad Request 400) Validation Error Some parameters may contain invalid values
   */
  // TODO: Figure out how to create link connected to user
  .post(authorize(LOGGED_USER), validate(createLink), controller.create)
  /**
   * @api {put} v1/link Update Link
   * @apiDescription Update an existing link
   * @apiVersion 1.0.0
   * @apiName UpdateLink
   * @apiGroup Link
   * @apiPermission user
   *
   * @apiHeader {String} Authorization   User's access token
   *
   * @apiParam {String}    [uri]        uri
   * @apiParam {String}    [linkId]     linkId
   * @apiParam {String}    [sLink]      sLink
   * @apiParam {String}    [domain]     domain
   *
   * @apiSuccess (Created 201) {String} creatorId
   * @apiSuccess (Created 201) {String} url
   * @apiSuccess (Created 201) {String} type
   * @apiSuccess (Created 201) {String} shortLink
   *
   * @apiError (Bad Request 400)  ValidationError  Some parameters may contain invalid values
   * @apiError (Unauthorized 401) Unauthorized Only authenticated users can modify the data
   * @apiError (Forbidden 403)    Forbidden    Only user with same id or admins can modify the data
   * @apiError (Not Found 404)    NotFound     Link does not exist
   */
  .put(authorize(LOGGED_USER), validate(updateLink), controller.update);

module.exports = router;
