"use strict";

const API = require("./API");
const Thing = require("dcd-model/entities/Thing");

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
     * @apiParam (Body) {Thing} thing Thing to create as JSON.
     * @apiParamExample {json} thing:
     *     {
     *       "name": "My Thing",
     *       "description": "A description of my thing.",
     *       "type": "Test Thing"
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
        const jwt =
          request.query.jwt !== undefined
            ? request.query.jwt === "true"
            : false;
        this.model.things
          .create(actorId, thing, jwt)
          .then(result => this.success(response, { thing: result }))
          .catch(error => next(error));
      }
    );

    /**
     * @api {get} /things List
     * @apiGroup Thing
     * @apiDescription List Things.
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
          .then(result => this.success(response, { things: result }))
          .catch(error => next(error));
      }
    );

    /**
     * @api {get} /things/thingId Read
     * @apiGroup Thing
     * @apiDescription Read a Thing.
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
            this.success(response, { thing: result });
          })
          .catch(error => next(error));
      }
    );

    /**
     * @api {put} /things/thingId Update
     * @apiGroup Thing
     * @apiDescription Update a Thing.
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
          .then(result => this.success(response, result))
          .catch(error => next(error));
      }
    );

    /**
     * @api {delete} /things/thingId Delete
     * @apiGroup Thing
     * @apiDescription Delete a Thing.
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
          .then(result => {
            this.success(
              response,
              {
                message: result.affectedRows + " Thing deleted."
              },
              204
            );
          })
          .catch(error => next(error));
      }
    );

    this.router.put(
      "/:entityId/grant/:role/:entityType/:subjectId",
      this.formatEntityId,
      this.introspectToken(["dcd:things", "dcd:roles"]),
      this.checkPolicy("things", "grant"),
      (request, response, next) => {
        this.model.policies
          .grant(
            request.params.subjectId,
            request.params.entityId,
            request.params.role
          )
          .then(result => this.success(response, result))
          .catch(error => next(error));
      }
    );

    this.router.put(
      "/:entityId/revoke/:role/:entityType/:subjectId",
      this.formatEntityId,
      this.introspectToken(["dcd:things", "dcd:roles"]),
      this.checkPolicy("things", "revoke"),
      (request, response, next) => {
        this.model.policies
          .revoke(
            request.params.subjectId,
            request.params.entityId,
            request.params.role
          )
          .then(result => this.success(response, result))
          .catch(error => next(error));
      }
    );
  }
}

module.exports = ThingAPI;
