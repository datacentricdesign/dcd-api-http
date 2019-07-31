"use strict";

const API = require("./API");
const Thing = require("dcd-model/entities/Thing");

class ThingAPI extends API {
  constructor(model, auth) {
    super(model, auth);
  }

  init() {
    /**
     * Create a Thing.
     *
     * @property {Thing} request.body
     */
    /**
     * @api {post} /things Create
     * @apiGroup Thing
     * @apiDescription Create a Thing.
     *
     *
     * @property {String} request.query.jwt (true|false, default: false)
     *           Need to generate a JWT
     * @property {Boolean} request.query.thingId (optional, default: undefined)
     *           Forward to update (Web forms cannot submit PUT methods)
     *
     * @apiHeader {String} Content-type application/json
     *
     * @apiSuccess {object} thing The created Thing
     */
    this.router.post(
      "/",
      this.auth.introspect,
      this.auth.wardenSubject({ resource: "things", action: "create" }),
      (request, response) => {
        // Web forms cannot submit PUT methods, we check the flag update
        if (request.query.thingId !== undefined) {
          request.body.entityId = request.query.thingId;
          return this.model.things
            .update(new Thing(request.body))
            .then(result => API.success(response, result))
            .catch(error => API.fail(response, error));
        }

        const personId = request.user.sub;
        const thing = new Thing(request.body);
        const jwt =
          request.query.jwt !== undefined
            ? request.query.jwt === "true"
            : false;
        this.model.things
          .create(personId, thing, jwt)
          .then(result => API.success(response, { thing: result }))
          .catch(error => API.fail(response, error));
      }
    );

    /**
     * List Things.
     */
    this.router.get(
      "/",
      this.auth.introspect,
      this.auth.wardenSubject({ resource: "things", action: "list" }),
      (request, response) => {
        this.model.things
          .list(request.user.sub)
          .then(result => API.success(response, { things: result }))
          .catch(error => API.fail(response, error));
      }
    );

    /**
     * Read a Thing.
     */
    this.router.get(
      "/:entityId",
      this.auth.introspect,
      this.auth.wardenSubject({ resource: "things", action: "read" }),
      (request, response) => {
        this.model.things
          .read(request.params.entityId)
          .then(result => {
            API.success(response, { thing: result });
          })
          .catch(error => API.fail(response, error));
      }
    );

    /**
     * Update a Thing.
     */
    this.router.put(
      "/:entityId",
      this.auth.introspect,
      this.auth.wardenSubject({ resource: "things", action: "update" }),
      (request, response) => {
        this.model.things
          .update(new Thing(request.body, request.params.entityId))
          .then(result => API.success(response, result))
          .catch(error => API.fail(response, error));
      }
    );

    /**
     * Delete a Thing.
     */
    this.router.delete(
      "/:entityId",
      this.auth.introspect,
      this.auth.wardenSubject({ resource: "things", action: "delete" }),
      (request, response) => {
        this.model.things
          .del(request.params.entityId)
          .then(result => API.success(response, result))
          .catch(error => API.fail(response, error));
      }
    );
  }
}

module.exports = ThingAPI;
