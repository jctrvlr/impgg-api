const express = require('express');
const validate = require('express-validation');
const controller = require('../controllers/link.controller');
// const { authorize, LOGGED_USER } = require('../middlewares/auth');
const {
  getLink,
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

module.exports = router;
