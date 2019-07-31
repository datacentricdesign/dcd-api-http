"use strict";

const API = require("./API");

class HealthAPI extends API {
  constructor(model, auth) {
    super(model, auth);
  }

  init() {
    /**
     * @api {get} /health Check
     * @apiGroup Health
     * @apiDescription Check status of the DCD Hub.
     *
     * @apiSuccess {object} status The status of the DCD Hub
     */
    this.router.get("/", (request, response) => {
      this.success(response, { status: 0, message: "OK" });
    });
  }
}

module.exports = HealthAPI;
