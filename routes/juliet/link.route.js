const express = require('express');
const validate = require('express-validation');
const controller = require('../../controllers/link.controller');
const {
  createLink,
} = require('../../validations/link.validation');

const router = express.Router();

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
  .post(validate(createLink), controller.createPub);
module.exports = router;
