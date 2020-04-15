"use strict";

const API = require("./API");
const Person = require("@datacentricdesign/model/entities/Person");

/**
 * PersonAPI provides the routes for managing Persons of the DCD Hub.
 * A Person represents a physical person, signed up on the hub.
 * It can own, share and have access to Things.
 */
class PersonAPI extends API {
  constructor(model) {
    super(model);
  }

  formatEntityId(request, response, next) {
    if (request.params.entityId !== undefined) {
      if (!request.params.entityId.startsWith("dcd:persons:")) {
        request.params.entityId = "dcd:persons:" + request.params.entityId;
      }
    }
    next();
  }

  init() {
    /**
     * Add the entity Type 'persons' to all request of this router.
     */
    this.router.use((request, response, next) => {
      request.entityType = "persons";
      next();
    });

    // this.router.param('entityId', (req, res, next, entityId) => {
    //   // executes before route handler
    //
    //   next();
    // });

    /**
     * @api {post} /persons Create
     * @apiGroup Person
     * @apiDescription Create a Person.
     *
     * @apiVersion 0.1.0
     *
     * @apiHeader {String} Content-type application/json
     *
     * @apiParam (Body) {string} A id Unique identifier such as email address
     * @apiParam (Body) {string} name The name of the person
     * @apiParam (Body) {string} password A minimum 8-character long password
     *
     * @apiPermission Requires scope 'dcd:persons'
     *
     * @apiSuccess {object} personId Id of the created Person
     */
    this.router.post("/", (request, response, next) => {
      const person = new Person(request.body);
      this.logger.debug(person);
      this.model.persons
        .create(person)
        .then(result => this.success(response, { personId: result }, 201))
        .catch(error => next(error));
    });

    /**
     * @api {get} /persons List
     * @apiGroup Person
     * @apiDescription List Persons.
     *
     * @apiVersion 0.1.0
     *
     * @apiHeader {String} Authorization TOKEN ID
     *
     * @apiPermission Requires scope 'dcd:persons'
     *
     * @apiSuccess {array} persons Array of Persons found.
     */
    this.router.get(
      "/",
      this.introspectToken(["dcd:persons"]),
      this.checkPolicy("persons", "list"),
      (request, response, next) => {
        this.model.persons
          .list(request.user.sub)
          .then(result => this.success(response, { persons: result }, 200))
          .catch(error => next(error));
      }
    );

    /**
     * @api {get} /persons/:personId Read
     * @apiGroup Person
     * @apiDescription Read a Person.
     *
     * @apiVersion 0.1.0
     *
     * @apiHeader {String} Authorization TOKEN ID
     *
     * @apiPermission Requires scope 'dcd:persons'
     *
     * @apiParam {String} personId Id of the Person to read.
     *
     * @apiSuccess {object} person Person found.
     */
    this.router.get(
      "/:entityId",
      this.formatEntityId,
      this.introspectToken(["dcd:persons"]),
      this.checkPolicy("persons", "read"),
      (request, response, next) => {
        this.model.persons
          .read(request.params.entityId)
          .then(result => this.success(response, { person: result }, 200))
          .catch(error => next(error));
      }
    );

    /**
     * @api {put} /persons/:personId Update
     * @apiGroup Person
     * @apiDescription Update a Person.
     *
     * @apiVersion 0.1.0
     *
     * @apiHeader {String} Content-type application/json
     * @apiHeader {String} Authorization TOKEN ID
     *
     * @apiPermission Requires scope 'dcd:persons'
     *
     */
    this.router.put(
      "/:entityId",
      this.formatEntityId,
      this.introspectToken(["dcd:persons"]),
      this.checkPolicy("persons", "update"),
      (request, response, next) => {
        const person = new Person(request.params.entityId, request.body);
        this.model.persons
          .update(person)
          .then(result => this.success(response, result, 200))
          .catch(error => next(error));
      }
    );

    /**
     * @api {delete} / Delete
     * @apiGroup Person
     * @apiDescription Delete a Person.
     *
     * @apiVersion 0.1.0
     *
     * @apiHeader {String} Authorization TOKEN ID
     *
     * @apiPermission Requires scope 'dcd:persons'
     */
    this.router.delete(
      "/:entityId",
      this.formatEntityId,
      this.introspectToken(["dcd:persons"]),
      this.checkPolicy("persons", "delete"),
      (request, response, next) => {
        const personId = request.params.entityId;
        this.model.persons
          .del(personId)
          .then(nbDelete => {
            this.success(
              response,
              { message: nbDelete + " Person(s) deleted." },
              200
            );
          })
          .catch(error => next(error));
      }
    );

    /**
     * @api {post} /persons/:personId/check Check
     * @apiGroup Person
     * @apiDescription Check a Person's credentials.
     *
     * @apiVersion 0.1.0
     *
     * @apiHeader {String} Content-type application/json
     * @apiHeader {String} Authorization TOKEN ID
     *
     * @apiPermission Requires scope 'dcd:persons' and 'dcd:auth'
     *
     * @apiSuccess {object} person Person found.
     */
    this.router.post(
      "/:entityId/check",
      this.formatEntityId,
      this.introspectToken(["dcd:persons", "dcd:auth"]),
      (request, response, next) => {
        if (request.body !== undefined && request.body.password !== undefined) {
          this.model.persons
            .check(request.params.entityId, request.body.password)
            .then(result => this.success(response, { person: result }, 200))
            .catch(error => next(error));
        }
      }
    );
  }
}

module.exports = PersonAPI;
