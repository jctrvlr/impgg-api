const express = require('express');
const validate = require('express-validation');
const controller = require('../../controllers/messages.controller');
const {
  saveMessage,
} = require('../../validations/messages.validation');

const router = express.Router();

router
  .route('/')
  /**
   * @api {post} v1/messages Save message
   * @apiDescription Save message
   * @apiVersion 1.0.0
   * @apiName Save message
   * @apiGroup Messages
   * @apiPermission public
   *
   * @apiParam {String}    [email]    email
   * @apiParam {String}    [subject]    subject
   * @apiParam {String}    [message]    message
   *
   * @apiSuccess (OK 200) {Boolean} checkDup
   */
  .post(validate(saveMessage), controller.saveMessage);

module.exports = router;
