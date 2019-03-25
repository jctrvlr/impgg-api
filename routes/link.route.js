const express = require('express');
const validate = require('express-validation');
const controller = require('../controllers/link.controller');
const { authorize, LOGGED_USER } = require('../middlewares/auth');
const {
  getLink,
  createLink,
  getLinkInfo,
  updateLink,
  listLinks,
} = require('../validations/link.validation');

const router = express.Router();

router
  .route('/:linkId')
  /**
   * @api {get} / Get link w/ redirect
   * @apiDescription Get a link and redirects to given
   * @apiVersion 1.0.0
   * @apiName Get Link
   * @apiGroup Link
   * @apiPermission public
   *
   * @apiParam {String}    [id]    linkId
   *
   * @apiSuccess {Redirect 301} 301 Redirect to link URI
   *
   * @apiError (Bad Request 400)  ValidationError Some parameters may contain invalid values
   */
  .get(validate(getLink), controller.get);

router
  .route('/link/:linkId')
  /**
   * @api {get} /link Get link info
   * @apiDescription Get a link and redirects to given
   * @apiVersion 1.0.0
   * @apiName Get Link
   * @apiGroup Link
   * @apiPermission public
   *
   * @apiHeader {String} Authorization   User's access token
   *
   * @apiParam {String}    [linkId]    linkId
   *
   * @apiSuccess (Created 201) {String} creatorId
   * @apiSuccess (Created 201) {String} url
   * @apiSuccess (Created 201) {String} type
   * @apiSuccess (Created 201) {String} shortLink
   *
   * @apiError (Bad Request 400)  ValidationError Some parameters may contain invalid values
   */
  .get(authorize(LOGGED_USER), validate(getLinkInfo), controller.getLink);

router
  .route('/link')
  /**
   * @api {post} /link Create Link
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
  .post(authorize(LOGGED_USER), validate(createLink), controller.create)
  /**
   * @api {put} /link Update Link
   * @apiDescription Update an existing link
   * @apiVersion 1.0.0
   * @apiName UpdateLink
   * @apiGroup Link
   * @apiPermission user
   *
   * @apiHeader {String} Authorization   User's access token
   *
   * @apiParam {String}    [oldSLink]     oldSLink
   * @apiParam {String}    [CreatorId]    CreatorId
   * @apiParam {String}    [uri]          uri
   * @apiParam {String}    [newSLink]     newSLink
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

router
  .route('/links')
  /**
   * @api {get} /links Get list of links
   * @apiDescription Get a list of links
   * @apiVersion 1.0.0
   * @apiName ListLinks
   * @apiGroup Link
   * @apiPermission user
   *
   * @apiHeader {String} Authorization   User's access token
   *
   * @apiParam  {Number{1-}}             [page=1]      List page
   * @apiParam  {Number{1-100}}          [perPage=1]   Links per page
   * @apiParam  {String}                 [creatorId]   Link's creatorId
   * @apiParam  {String}                 [url]         Link's url
   * @apiParam  {String=website,youtube} [type]        Link's type
   * @apiParam  {String}                 [shortLink]   Link's shortLink
   *
   * @apiSuccess {Object[]} links List of links.
   *
   * @apiError (Unauthorized 401)  Unauthorized  Only authenticated users can access the data
   * @apiError (Forbidden 403)     Forbidden     Only admins can access the data
   */
  .get(authorize(LOGGED_USER), validate(listLinks), controller.list);

module.exports = router;
