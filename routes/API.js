"use strict";

// Setting the logs
const log4js = require("log4js");

// Express router
const express = require("express");
const utils = require("../utils/writer.js");

class API {
  constructor(model, auth) {
    this.model = model;
    this.auth = auth;
    this.router = express.Router();

    this.logger = log4js.getLogger(
      "[dcd-api-http:" + this.constructor.name + "]"
    );
    this.logger.level = process.env.LOG_LEVEL || "INFO";

    this.init();
  }

  init() {}

  static success(response, result) {
    this.logger.debug(result);
    utils.writeJson(response, result);
  }

  static fail(response, error) {
    this.logger.error(error);
    utils.writeJson(response, error);
  }
}

module.exports = API;
