'use strict'

const API = require('./API')

/**
 * HealthAPI provides the routes for checking the status of the DCD Hub.
 */
class HealthAPI extends API {
  constructor (model) {
    super(model)
  }

  init () {
    /**
     * @api {get} /health Check
     * @apiGroup Health
     * @apiDescription Check status of the DCD Hub.
     *
     * @apiVersion 0.1.0
     *
     * @apiSuccess {object} status The status of the DCD Hub
     */
    this.router.get('/', (request, response) => {
      this.success(response, { status: 0, message: 'OK' })
    })
  }
}

module.exports = HealthAPI
