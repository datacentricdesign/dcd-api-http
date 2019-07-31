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
      .then(result => {
        logger.debug(result);
        return success(response, { stat: result });
      })
      .catch(error => fail(response, error));
  });

/**
* @api {get} /stats/:propertyType Property Type
* @apiGroup Stat
* @apiDescription Get number of properties, entities and values of a property type in a range date.
*
* @apiHeader {String} Authorization TOKEN ID
* @apiParam {String} propertyType   Property type, ex : "LOCATION".
* @apiParam {Number} [from] Optional Query timestamp from of the range date.
* @apiParam {Number} [to] Optional Query timestamp to of the range date.
*
* @apiSuccess {json} Json of a property type stats.
*/
this.router.get("/:propertyType",
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
        .then(result => {
          logger.debug(result);
          return success(response, { stat: result });
        })
        .catch(error => fail(response, error));
    }
  );

  }
}

module.exports = StatAPI;

const success = (response, result) => {
  logger.debug(result);
  utils.writeJson(response, result);
};

const fail = (response, error) => {
  logger.error(error);
  utils.writeJson(response, error);
};
