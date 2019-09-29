"use strict";

// Setting the logs
const log4js = require("log4js");

// Express router
const express = require("express");
const utils = require("../utils/writer.js");

const DCDError = require("dcd-model/lib/Error");

class API {
  /**
   *
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

  init() {}

  success(response, result) {
    this.logger.debug(result);
    utils.writeJson(response, result);
  }

  fail(response, error) {
    this.logger.error(error);
    utils.writeJson(response, error);
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
            req.user = user;
            next();
          })
          .catch(error => next(error));
      })
    );
  }

  // warden subject
  checkPolicy(resource, action) {
    return (
      this.checkPolicy[(resource, action)] ||
      (this.checkPolicy[(resource, action)] = (req, res, next) => {
        const acpResource = buildACPResource(resource, req);
        const acp = {
          resource: acpResource,
          action: "dcd:actions:" + action,
          subject: req.user.sub
        };

        this.model.policies
          .check(acp)
          .then(() => next())
          .catch(error => next(error));
      })
    );
  }

  // warden token
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
  let acpResource = "dcd";
  if (req.entityType !== undefined) {
    acpResource += ":" + req.entityType;
  } else {
    acpResource += ":" + resource;
  }
  if (req.params.entityId !== undefined) {
    acpResource += ":" + req.params.entityId;
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
  } else if (!req.get("Authorization").startsWith("bearer ")) {
    throw new DCDError(
      4031,
      "Add 'bearer ' in front of your 'Authorization' token."
    );
  }
  return req.get("Authorization").replace(/bearer\s/gi, "");
}
