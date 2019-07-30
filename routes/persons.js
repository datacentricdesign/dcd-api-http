"use strict";

// Setting the logs
const log4js = require("log4js");
const logger = log4js.getLogger("[dcd-api-http:persons]");
logger.level = process.env.LOG_LEVEL || "INFO";

// Express router
const express = require("express");
const utils = require("../utils/writer.js");
const Person = require("dcd-model/entities/Person");

class PersonAPI {
  constructor(model, auth) {
    this.model = model;
    this.auth = auth;
    this.router = express.Router();
    this.init();
  }

  init() {
    /**
     * @api {post} /persons Create
     * @apiGroup Person
     * @apiDescription Create a Person.
     *
     * @apiSuccess {object} personId Id of the created Person
     */
    this.router.post("/", (request, response) => {
      const person = new Person(request.body);
      this.model.persons
        .create(person)
        .then(result => success(response, { personId: result }))
        .catch(error => fail(response, error));
    });

    /**
     * @api {get} /persons List
     * @apiGroup Person
     * @apiDescription List Persons.
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
          .then(result => success(response, result))
          .catch(error => fail(response, error));
      }
    );

    /**
     * @api {get} /persons/:personId Read
     * @apiGroup Person
     * @apiDescription Read a Person.
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
          .then(result => success(response, { person: result }))
          .catch(error => fail(response, error));
      }
    );

    /**
     * @api {put} /persons/:personId Update
     * @apiGroup Person
     * @apiDescription Update a Person.
     */
    this.router.put(
      "/:entityId",
      this.auth.introspect,
      this.auth.wardenSubject({ resource: "persons", action: "update" }),
      (request, response) => {
        const person = new Person(request.params.entityId, request.body);
        this.model.persons
          .update(person)
          .then(result => success(response, result))
          .catch(error => fail(response, error));
      }
    );

    /**
     * @api {delete} / Delete
     * @apiGroup Person
     * @apiDescription Delete a Person.
     */
    this.router.delete(
      "/:entityId",
      this.auth.introspect,
      this.auth.wardenSubject({ resource: "persons", action: "delete" }),
      (request, response) => {
        const personId = request.params.entityId;
        this.model.persons
          .delete(personId)
          .then(result => success(response, result))
          .catch(error => fail(response, error));
      }
    );

    /**
     * @api {post} /persons/:personId/check Check
     * @apiGroup Person
     * @apiDescription Check a Person's credentials.
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
            .then(result => success(response, { person: result }))
            .catch(error => fail(response, error));
        }
      }
    );
  }
}

module.exports = PersonAPI;

const success = (response, result) => {
  logger.debug(result);
  utils.writeJson(response, result);
};

const fail = (response, error) => {
  logger.error(error);
  utils.writeJson(response, error);
};
