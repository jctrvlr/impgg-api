const express = require('express');
const validate = require('express-validation');
const controller = require('../../controllers/link.controller');
const { authorize, LOGGED_USER } = require('../../middlewares/auth');
const {
  listLinks,
} = require('../../validations/link.validation');

const router = express.Router();

router
  .route('/')
  /**
   * @api {get} v1/links Get list of links
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
   * @apiParam  {Boolean}                [archived]    Archived vs unarchived links
   *
   * @apiSuccess {Object[]} links List of links.
   *
   * @apiError (Unauthorized 401)  Unauthorized  Only authenticated users can access the data
   * @apiError (Forbidden 403)     Forbidden     Only admins can access the data
   */
  .get(authorize(LOGGED_USER), validate(listLinks), controller.list);

module.exports = router;
