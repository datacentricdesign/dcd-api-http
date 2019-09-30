"use strict";

const API = require("./API");
const DCDError = require("dcd-model/lib/Error");

/**
 * StatAPI provides the routes for searching DCD Hub data.
 */
class StatAPI extends API {
  constructor(model) {
    super(model);
  }

  init() {
    /**
     * @api {get} /stats Global
     * @apiGroup Stat
     * @apiDescription Get number of persons,things and properties.
     *
     * @apiVersion 0.1.0
     *
     * @apiHeader {String} Authorization TOKEN ID
     *
     * @apiSuccess {json} Json of global stats.
     */
    this.router.get("/", this.introspectToken, (request, response, next) => {
      this.model.stats
        .getGlobalStats()
        .then(result => this.success(response, { stats: result }))
        .catch(error => next(error));
    });

    /**
     * @api {get} /stats/propertyTypes Property Types
     * @apiGroup Stat
     * @apiDescription Get number of properties, entities and values of a property type in a range date of an array of properties. There must be values for the property entities to be counted in the range.
     *
     * @apiVersion 0.1.0
     *
     * @apiHeader {String} Authorization TOKEN ID
     * @apiParam (Query) {Array} [types] array of property type.
     * @apiParam (Query) {Number} [from] Optional timestamp from of the range date.
     * @apiParam (Query) {Number} [to] Optional Query timestamp to of the range date.
     * @apiParamExample {String} query:
     * "https://dwd.tudelft.nl/api/stats/propertyTypes?types=LOCATION,THREE_DIMENSIONS&from=0&to=1565870227438"
     * @apiSuccess {json} Json of a property type stats.
     */
    this.router.get(
      "/propertyTypes",
      this.introspectToken,
      (request, response, next) => {
        if (!request.query.types) {
          this.next(new DCDError(400, "Add 'types' query param"));
        } else {
          let propertyTypes = request.query.types.split(",");
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
            .catch(error => next(error));
        }
      }
    );
  }
}

module.exports = StatAPI;
