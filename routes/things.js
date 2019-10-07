"use strict";

const API = require("./API");
const Thing = require("dcd-model/entities/Thing");

/**
 * ThingAPI provides the routes for managing Things of the DCD Hub.
 */
class ThingAPI extends API {
  constructor(model) {
    super(model);
  }

  formatEntityId(request, response, next) {
    if (request.params.entityId !== undefined) {
      if (!request.params.entityId.startsWith("dcd:things:")) {
        request.params.entityId = "dcd:things:" + request.params.entityId;
      }
    }
    next();
  }

  init() {
    /**
     * Add the entity Type 'persons' to all request of this router.
     */
    this.router.use((req, res, next) => {
      req.entityType = "things";
      next();
    });

    /**
     * @api {post} /things Create
     * @apiGroup Thing
     * @apiDescription Create a Thing.
     *
     * @apiVersion 0.1.0
     *
     * @apiParam (Body) {Thing} thing Thing to create as JSON.
     * @apiParamExample {json} thing:
     *     {
     *       "name": "My Thing",
     *       "description": "A description of my thing.",
     *       "type": "Test Thing",
     *       "pem": "PEM PUBLIC KEY"
     *     }
     *
     * @apiParam (Query) {Boolean} [jwt=false] Need to generate a JWT
     * @apiParam (Query) {Boolean} [thingId] Forward to update (Web forms cannot submit PUT methods)
     *
     * @apiHeader {String} Content-type application/json
     * @apiHeader {String} Authorization TOKEN ID
     *
     * @apiSuccess {object} thing The created Thing
     */
    this.router.post(
      "/",
      this.introspectToken(["dcd:things"]),
      this.checkPolicy("things", "create"),
      (request, response, next) => {
        // Web forms cannot submit PUT methods, we check the flag update
        if (request.query.thingId !== undefined) {
          request.body.entityId = request.query.thingId;
          return this.model.things
            .update(new Thing(request.body))
            .then(result => this.success(response, result))
            .catch(error => next(error));
        }

        const actorId = request.user.sub;
        const thing = new Thing(request.body);
        // const jwt =
        //   request.query.jwt !== undefined
        //     ? request.query.jwt === "true"
        //     : false;
        const jwt = true;
        thing["pem"] = undefined;
        this.model.things
          .create(actorId, thing, jwt)
          .then(result => this.success(response, { thing: result }, 201))
          .catch(error => next(error));
      }
    );

    /**
     * @api {get} /things List
     * @apiGroup Thing
     * @apiDescription List Things.
     *
     * @apiVersion 0.1.0
     *
     * @apiHeader {String} Authorization TOKEN ID
     *
     * @apiSuccess {object} things The retrieved Things
     */
    this.router.get(
      "/",
      this.introspectToken(["dcd:things"]),
      this.checkPolicy("things", "list"),
      (request, response, next) => {
        this.model.things
          .list(request.user.sub)
          .then(result => this.success(response, { things: result }, 200))
          .catch(error => next(error));
      }
    );

    /**
     * @api {get} /things/thingId Read
     * @apiGroup Thing
     * @apiDescription Read a Thing.
     *
     * @apiVersion 0.1.0
     *
     * @apiHeader {String} Authorization TOKEN ID
     *
     * @apiParam {String} thingId Id of the Thing to read.
     *
     * @apiSuccess {object} thing The retrieved Thing
     */
    this.router.get(
      "/:entityId",
      this.formatEntityId,
      this.introspectToken(["dcd:things"]),
      this.checkPolicy("things", "read"),
      (request, response, next) => {
        this.model.things
          .read(request.params.entityId)
          .then(result => {
            this.success(response, { thing: result }, 200);
          })
          .catch(error => next(error));
      }
    );

    /**
     * @api {put} /things/thingId Update
     * @apiGroup Thing
     * @apiDescription Update a Thing.
     *
     * @apiVersion 0.1.0
     *
     * @apiHeader {String} Authorization TOKEN ID
     *
     * @apiParam {String} thingId Id of the Thing to update.
     */
    this.router.put(
      "/:entityId",
      this.formatEntityId,
      this.introspectToken(["dcd:things"]),
      this.checkPolicy("things", "update"),
      (request, response, next) => {
        this.model.things
          .update(new Thing(request.body, request.params.entityId))
          .then(result => this.success(response, result, 200))
          .catch(error => next(error));
      }
    );

    /**
     * @api {put} /things/thingId/jwk Update PEM
     * @apiGroup Thing
     * @apiDescription Update a Thing PEM.
     *
     * @apiVersion 0.1.0
     *
     * @apiHeader {string} Authorization TOKEN ID
     *
     * @apiParam {string} thingId Id of the Thing to update.
     *
     * @apiBody {string} thingId Id of the Thing to update.
     * @apiBody {string} pem of the Thing to update.
     */
    this.router.put(
      "/:entityId/pem",
      this.formatEntityId,
      this.introspectToken(["dcd:things"]),
      this.checkPolicy("things", "update"),
      (request, response, next) => {
        this.model.auth
          .setPEM(request.params.entityId, request.body.pem)
          .then(result => this.success(response, result, 200))
          .catch(error => next(error));
      }
    );

    /**
     * @api {delete} /things/thingId Delete
     * @apiGroup Thing
     * @apiDescription Delete a Thing.
     *
     * @apiVersion 0.1.0
     *
     * @apiHeader {String} Authorization TOKEN ID
     *
     * @apiParam {String} thingId Id of the Thing to delete.
     */
    this.router.delete(
      "/:entityId",
      this.formatEntityId,
      this.introspectToken(["dcd:things"]),
      this.checkPolicy("things", "delete"),
      (request, response, next) => {
        this.model.things
          .del(request.params.entityId)
          .then(nbDelete => {
            this.success(
              response,
              { message: nbDelete + " Thing(s) deleted." },
              200
            );
          })
          .catch(error => next(error));
      }
    );
  }
}

module.exports = ThingAPI;
