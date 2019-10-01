"use strict";

// Setting the logs
const log4js = require("log4js");

// Express router
const express = require("express");

const DCDError = require("dcd-model/lib/Error");

class API {
  /**
   * DCD API super class with introspection and policy functions
   * @param {DCDModel} model
   */
  constructor(model) {
    this.model = model;
    this.policies = this.model.policies;
    this.router = express.Router();

    this.logger = log4js.getLogger(
      "[dcd-api-http:" + this.constructor.name + "]"
    );
    this.logger.level = process.env.LOG_LEVEL || "INFO";

    this.init();
  }

  /**
   * The place to declare API routes
   */
  init() {}

  /**
   * A standard way to format successful responses
   * @param {Response} response
   * @param {object|string} payload
   * @param {int} status
   */
  success(response, payload, status = 200) {
    this.logger.debug(payload);
    if (typeof payload === "object") {
      payload = JSON.stringify(payload, null, 2);
    }
    response.set({ "Content-Type": "application/json" });
    response.status(status).send(payload);
  }

  /**
   * Introspect the token from the 'Authorization' HTTP header to
   * determined if it is valid and who it belongs to.
   */
  introspectToken(requiredScope = []) {
    return (
      this.introspectToken[requiredScope] ||
      (this.introspectToken[requiredScope] = (req, res, next) => {
        this.logger.debug("auth introspect");
        this.logger.debug(requiredScope);
        const token = extractToken(req);
        return this.model.auth
          .refresh()
          .then(() => {
            this.logger.debug("successful token refresh");
            if (
              token.split(".").length === 3 &&
              req.params.entityId !== undefined
            ) {
              this.logger.debug("token is JWT");
              return this.model.auth.checkJWTAuth(token).then(token => {
                const user = {
                  entityId: req.params.entityId,
                  token: token,
                  sub: "dcd:" + req.entityType + ":" + req.params.entityId
                };
                return Promise.resolve(user);
              });
            } else {
              this.logger.debug("forward to introspect model");
              return this.model.auth.introspect(token, requiredScope);
            }
          })
          .then(user => {
            this.logger.debug(user);
            req.user = user;
            next();
          })
          .catch(error => next(error));
      })
    );
  }

  /**
   * Check Access Control Policy with Keto, based on subject
   * @param resource
   * @param action
   * @return {Function}
   */
  checkPolicy(resource, action) {
    return (this.checkPolicy[{ resource, action }] = (req, res, next) => {
      this.logger.debug("check policy");
      const acpResource = buildACPResource(resource, req);
      this.logger.debug(acpResource);
      const acp = {
        resource: acpResource,
        action: "dcd:actions:" + action,
        subject: req.user.sub
      };
      this.logger.debug(acp);
      this.model.policies
        .check(acp)
        .then(() => next())
        .catch(error => next(error));
    });
  }

  /**
   * Check Access Control Policy with Keto, based on token
   * @param resource
   * @param action
   * @param scope
   * @return {*|Function}
   */
  checkTokenPolicy(resource, action, scope = []) {
    return (
      this.checkTokenPolicy[(resource, action, scope)] ||
      (this.checkTokenPolicy[(resource, action)] = (req, res, next) => {
        const token = extractToken(req);
        const acp = {
          resource: buildACPResource(resource, req),
          action: "dcd:actions:" + action,
          scope: scope,
          token: token
        };
        this.logger.debug("acp");
        this.logger.debug(acp);

        if (
          token.split(".").length === 3 &&
          req.params.entityId !== undefined
        ) {
          acp.subject = "dcd:" + req.entityType + ":" + req.params.entityId;
          this.model.auth
            .checkJWT(acp, req.params.entityId)
            .then(user => {
              if (user !== undefined) {
                req.user = user;
                next();
              } else {
                next(new DCDError(4031, "The user is undefined"));
              }
            })
            .catch(error => next(error));
        } else {
          this.model.auth
            .wardenToken(acp)
            .then(user => {
              req.user = user;
              next();
            })
            .catch(error => next(error));
        }
      })
    );
  }
}

module.exports = API;

/**
 * Build ACP resource from request path
 * @param resource
 * @param req
 * @return {string}
 */
function buildACPResource(resource, req) {
  // let acpResource = "dcd";
  // if (req.entityType !== undefined) {
  //   acpResource += ":" + req.entityType;
  // } else {
  //   acpResource += ":" + resource;
  // }
  let acpResource = "";
  if (req.params.entityId !== undefined) {
    acpResource += req.params.entityId;
  } else {
    acpResource += "dcd:" + resource;
  }
  if (req.params.component !== undefined) {
    acpResource += ":" + req.params.component;
  }
  if (req.params.propertyId !== undefined) {
    acpResource += ":" + req.params.propertyId;
  }
  return acpResource;
}

/**
 * Check and extract the token from the header
 * @param req
 * @return {*|void|string}
 */
function extractToken(req) {
  if (req.get("Authorization") === undefined) {
    throw new DCDError(4031, "Add 'Authorization' header.");
  } else if (
    !req.get("Authorization").startsWith("bearer ") &&
    !req.get("Authorization").startsWith("Bearer ")
  ) {
    throw new DCDError(
      4031,
      "Add 'bearer ' in front of your 'Authorization' token."
    );
  }
  const token = req
    .get("Authorization")
    .replace(/bearer\s/gi, "")
    .replace(/Bearer\s/gi, "");
  return token;
}
