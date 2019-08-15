"use strict";

const API = require("./API");

class StatAPI extends API {
  constructor(model, auth) {
    super(model, auth);
  }

  init() {

/**
* @api {get} /stats Global
* @apiGroup Stat
* @apiDescription Get number of persons,things and properties.
*
* @apiHeader {String} Authorization TOKEN ID
*
* @apiSuccess {json} Json of global stats.
*/
this.router.get("/", 
this.auth.introspect, (request, response) => {
    this.model.stats
      .getGlobalStats()
      .then(result => this.success(response, { stats: result }))
      .catch(error => this.fail(response, error));
  });

/**
* @api {get} /stats/propertyTypes/:propertyType Property Type
* @apiGroup Stat
* @apiDescription Get number of properties, entities and values of a property type in a range date. There must be values for the property entities to be counted in the range.
*
* @apiHeader {String} Authorization TOKEN ID
* @apiParam {String} propertyType   Property type, ex : "LOCATION".
* @apiParam {Number} [from] Optional Query timestamp from of the range date.
* @apiParam {Number} [to] Optional Query timestamp to of the range date.
*
* @apiSuccess {json} Json of a property type stats.
*/
this.router.get("/propertyTypes/:propertyType",
    this.auth.introspect,
    (request, response) => {
      const propertyType = request.params.propertyType;
      let from;
      let to;
      if (request.query.from !== undefined) {
        from = parseInt(request.query.from);
      }
      if (request.query.to !== undefined) {
        to = parseInt(request.query.to);
      }
      this.model.stats
        .getTypeStats(propertyType, from, to)
        .then(result => this.success(response, { stats: result }))
        .catch(error => this.fail(response, error));
    }
  );

/**
* @api {get} /stats/propertyTypes Property Types
* @apiGroup Stat
* @apiDescription Get number of properties, entities and values of a property type in a range date of an array of properties. There must be values for the property entities to be counted in the range.
*
* @apiHeader {String} Authorization TOKEN ID
* @apiParam (Query) {Array} [types] array of property type.
* @apiParam (Query) {Number} [from] Optional timestamp from of the range date.
* @apiParam (Query) {Number} [to] Optional Query timestamp to of the range date.
* @apiParamExample {String} query:
* "https://dwd.tudelft.nl/api/stats/propertyTypes?types=LOCATION,THREE_DIMENSIONS&from=0&to=1565870227438"
* @apiSuccess {json} Json of a property type stats.
*/
this.router.get("/propertyTypes",
    this.auth.introspect,
    (request, response) => {
      if (
        request.query.types === undefined 
        ) {
        return this.fail(
          new Error("types is undefined")
        );
      }

      let propertyTypes = request.query.types.split(',')
      let from;
      let to;
      if (request.query.from !== undefined) {
        from = parseInt(request.query.from);
      }
      if (request.query.to !== undefined) {
        to = parseInt(request.query.to);
      }

      this.model.stats
        .getTypesStats(propertyTypes, from, to)
        .then(result => this.success(response, { stats: result }))
        .catch(error => this.fail(response, error));
      }
  );

  }
}

module.exports = StatAPI;
