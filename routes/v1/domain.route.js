const express = require('express');
const validate = require('express-validation');
const controller = require('../../controllers/domain.controller');
const { authorize, LOGGED_USER } = require('../../middlewares/auth');
const {
  createDomain,
  updateDomain,
  checkURI,
  archiveDomain,
} = require('../../validations/domain.validation');

const router = express.Router();

router
  .route('/uniq')
  /**
   * @api {post} v1/domain/uniq Check for uri duplicate
   * @apiDescription Check for uri duplicate
   * @apiVersion 1.0.0
   * @apiName Check uri
   * @apiGroup Domain
   * @apiPermission public
   *
   * @apiHeader {String} Authorization   User's access token
   *
   * @apiParam {String}    [uri]    uri
   *
   * @apiSuccess (OK 200) {Boolean} checkDup
   */
  .post(authorize(LOGGED_USER), validate(checkURI), controller.checkURI);

router
  .route('/check')
  /**
   * @api {get} v1/domain/check Check dns is propagated
   * @apiDescription Check dns is propagated
   * @apiVersion 1.0.0
   * @apiName Check DNS
   * @apiGroup Domain
   * @apiPermission public
   *
   * @apiSuccess (OK 200) {Object} Domain
   */
  .get(controller.checkDNS);

router
  .route('/archive')
  /**
   * @api {post} v1/domain/archive Archive domain
   * @apiDescription Archive domain
   * @apiVersion 1.0.0
   * @apiName Archive domain
   * @apiGroup Domain
   * @apiPermission public
   *
   * @apiHeader {String} Authorization   User's access token
   *
   * @apiParam {String}    [domainId]    domainId
   *
   * @apiSuccess (OK 200) {Object} User
   */
  .post(authorize(LOGGED_USER), validate(archiveDomain), controller.archiveDomain);

router
  .route('/')
  /**
   * @api {post} v1/domain Create Domain
   * @apiDescription Create a new domain
   * @apiVersion 1.0.0
   * @apiName CreateDomain
   * @apiGroup Domain
   * @apiPermission public
   *
   * @apiHeader {String} Authorization  User's access token
   *
   * @apiParam {String}    [uri]        uri
   * @apiParam {String}    [domainType] domainType
   *
   * @apiSuccess (Created 201) {String} creatorId
   * @apiSuccess (Created 201) {String} uri
   * @apiSuccess (Created 201) {String} domainType
   * @apiSuccess (Created 201) {String} status
   *
   * @apiError (Bad Request 400) Validation Error Some parameters may contain invalid values
   */
  .post(authorize(LOGGED_USER), validate(createDomain), controller.create)
  /**
   * @api {put} v1/domain Update Domain
   * @apiDescription Update an existing domain
   * @apiVersion 1.0.0
   * @apiName UpdateDomain
   * @apiGroup Domain
   * @apiPermission user
   *
   * @apiHeader {String} Authorization   User's access token
   *
   * @apiParam {String}    [uri]        uri
   * @apiParam {String}    [domainId]     domainId
   * @apiParam {String}    [domainType]      domainType
   *
   * @apiSuccess (Created 201) {String} creatorId
   * @apiSuccess (Created 201) {String} uri
   * @apiSuccess (Created 201) {String} domainType
   * @apiSuccess (Created 201) {String} status
   *
   * @apiError (Bad Request 400)  ValidationError  Some parameters may contain invalid values
   * @apiError (Unauthorized 401) Unauthorized Only authenticated users can modify the data
   * @apiError (Forbidden 403)    Forbidden    Only user with same id or admins can modify the data
   * @apiError (Not Found 404)    NotFound     Link does not exist
   */
  .put(authorize(LOGGED_USER), validate(updateDomain), controller.update)
  /**
   * @api {delete} v1/domain Delete domain
   * @apiDescription Delete domain
   * @apiVersion 1.0.0
   * @apiName Delete domain
   * @apiGroup Domain
   * @apiPermission public
   *
   * @apiHeader {String} Authorization   User's access token
   *
   * @apiParam {String}    [domainId]    domainId
   *
   * @apiSuccess (OK 200) {Object} User
   */
  .delete(authorize(LOGGED_USER), validate(archiveDomain), controller.deleteDomain);

module.exports = router;
