const express = require('express');
const validate = require('express-validation');
const controller = require('../../controllers/reports.controller');
const { authorize, LOGGED_USER } = require('../../middlewares/auth');
const {
  clickReport,
} = require('../../validations/reports.validation');

const router = express.Router();

router
  .route('/click')
  /**
   * @api {get} v1/reports/click Get and send click report
   * @apiDescription Get and send click report
   * @apiVersion 1.0.0
   * @apiName Click report
   * @apiGroup Reports
   * @apiPermission public
   *
   * @apiHeader {String} Authorization   User's access token
   *
   * @apiParam {String}    [limit]    limit
   * @apiParam {Array}     [linkFilter] linkFilter
   *
   * @apiSuccess (OK 200) {Boolean} ReportSent
   */
  .post(authorize(LOGGED_USER), validate(clickReport), controller.clickReport);

module.exports = router;
