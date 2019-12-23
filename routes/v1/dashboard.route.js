const express = require('express');
const validate = require('express-validation');
const controller = require('../../controllers/dashboard.controller');
const { authorize, LOGGED_USER } = require('../../middlewares/auth');
const {
  getLinkInfo,
} = require('../../validations/dashboard.validation');

const router = express.Router();

router
  .route('/:linkId')
  /**
   * @api {get} v1/dashboard Get dashboard info
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
   * @apiSuccess (OK 200) {String} platform
   * @apiSuccess (OK 200) {String} device
   * @apiSuccess (OK 200) {String} browser
   * @apiSuccess (OK 200) {String} popLocation
   * @apiSuccess (OK 200) {String} referrer
   *
   * @apiError (Bad Request 400)  ValidationError Some parameters may contain invalid values
   */
  .get(authorize(LOGGED_USER), validate(getLinkInfo), controller.getLinkInfo);

module.exports = router;
