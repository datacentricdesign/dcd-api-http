"use strict";

const API = require("./API");
const Person = require("dcd-model/entities/Person");

class PersonAPI extends API {
  constructor(model, auth) {
    super(model, auth);
  }

  init() {
    /**
     * @api {post} /persons Create
     * @apiGroup Person
     * @apiDescription Create a Person.
     *
     * @apiHeader {String} Content-type application/json
     *
     * @apiParam (Body) {Person} person Person to create as JSON.
     *
     * @apiSuccess {object} personId Id of the created Person
     */
    this.router.post("/", (request, response, next) => {
      const person = new Person(request.body);
      this.model.persons
        .create(person)
        .then(result => this.success(response, { personId: result }))
        .catch(error => next(error));
    });

    /**
     * @api {get} /persons List
     * @apiGroup Person
     * @apiDescription List Persons.
     *
     * @apiHeader {String} Authorization TOKEN ID
     *
     * @apiSuccess {array} persons Array of Persons found.
     */
    this.router.get(
      "/",
      this.auth.introspect,
      this.auth.wardenSubject({ resource: "persons", action: "list" }),
      (request, response) => {
        this.model.persons
          .list(request.user.sub)
          .then(result => this.success(response, result))
          .catch(error => this.fail(response, error));
      }
    );

    /**
     * @api {get} /persons/:personId Read
     * @apiGroup Person
     * @apiDescription Read a Person.
     *
     * @apiHeader {String} Authorization TOKEN ID
     *
     * @apiParam {String} personId Id of the Person to read.
     *
     * @apiSuccess {object} person Person found.
     */
    this.router.get(
      "/:entityId",
      this.auth.introspect,
      this.auth.wardenSubject({ resource: "persons", action: "read" }),
      (request, response) => {
        this.model.persons
          .read(request.params.entityId)
          .then(result => this.success(response, { person: result }))
          .catch(error => this.fail(response, error));
      }
    );

    /**
     * @api {put} /persons/:personId Update
     * @apiGroup Person
     * @apiDescription Update a Person.
     *
     * @apiHeader {String} Content-type application/json
     * @apiHeader {String} Authorization TOKEN ID
     */
    this.router.put(
      "/:entityId",
      this.auth.introspect,
      this.auth.wardenSubject({ resource: "persons", action: "update" }),
      (request, response) => {
        const person = new Person(request.params.entityId, request.body);
        this.model.persons
          .update(person)
          .then(result => this.success(response, result))
          .catch(error => this.fail(response, error));
      }
    );

    /**
     * @api {delete} / Delete
     * @apiGroup Person
     * @apiDescription Delete a Person.
     *
     * @apiHeader {String} Authorization TOKEN ID
     */
    this.router.delete(
      "/:entityId",
      this.auth.introspect,
      this.auth.wardenSubject({ resource: "persons", action: "delete" }),
      (request, response) => {
        const personId = request.params.entityId;
        this.model.persons
          .delete(personId)
          .then(result => this.success(response, result))
          .catch(error => this.fail(response, error));
      }
    );

    /**
     * @api {post} /persons/:personId/check Check
     * @apiGroup Person
     * @apiDescription Check a Person's credentials.
     *
     * @apiHeader {String} Content-type application/json
     * @apiHeader {String} Authorization TOKEN ID
     *
     * @apiSuccess {object} person Person found.
     */
    this.router.post(
      "/:entityId/check",
      this.auth.introspect,
      // this.auth.wardenToken({
      //     resource: 'persons',
      //     scope: ['dcd:auth'], action: 'check'
      // }),
      (request, response) => {
        if (request.body !== undefined && request.body.password !== undefined) {
          this.model.persons
            .check(request.params.entityId, request.body.password)
            .then(result => this.success(response, { person: result }))
            .catch(error => this.fail(response, error));
        }
      }
    );
  }
}

module.exports = PersonAPI;
