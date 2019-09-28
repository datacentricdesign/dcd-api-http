"use strict";

// Setting the logs
const log4js = require("log4js");
const logger = log4js.getLogger("[dcd-api-http:auth]");
logger.level = process.env.LOG_LEVEL || "INFO";

const DCDError = require("dcd-model/lib/Error");

let model = null;
exports.setModel = newModel => {
  model = newModel;
};

/**
 * Introspect the token from the 'Authorization' HTTP header to
 * determined if it is valid and who it belongs to.
 * @return {Promise}
 */
exports.introspect = (req, res, next) => {
  logger.debug("auth introspect");
  const token = extractToken(req);
  return model.auth
    .refresh()
    .then(() => {
      logger.debug("successful token refresh");
      if (token.split(".").length === 3 && req.params.entityId !== undefined) {
        logger.debug("token is JWT");
        return model.auth.checkJWTAuth(token).then(token => {
          const user = {
            entityId: req.params.entityId,
            token: token,
            sub: "dcd:" + req.entityType + ":" + req.params.entityId
          };
          return Promise.resolve(user);
        });
      } else {
        logger.debug("forward to introspect model");
        return model.auth.introspect(token);
      }
    })
    .then(user => {
      req.user = user;
      next();
    })
    .catch(error => next(error));
};

exports.wardenToken = ({ resource, action, scope = [] }) => (
  req,
  res,
  next
) => {
  logger.debug("warden Token");
  const token = extractToken(req);
  logger.debug("extracted token");
  logger.debug(token);
  const acp = {
    resource: buildACPResource(resource, req),
    action: "dcd:actions:" + action,
    scope: scope,
    token: token
  };
  logger.debug("acp");
  logger.debug(acp);

  if (token.split(".").length === 3 && req.params.entityId !== undefined) {
    acp.subject = "dcd:" + req.entityType + ":" + req.params.entityId;
    model.auth
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
    model.auth
      .wardenToken(acp)
      .then(user => {
        req.user = user;
        next();
      })
      .catch(error => next(error));
  }
};

exports.wardenSubject = ({ resource, action }) => (req, res, next) => {
  const acpResource = buildACPResource(resource, req);
  const acp = {
    resource: acpResource,
    action: "dcd:actions:" + action,
    subject: req.user.sub
  };

  model.auth
    .wardenSubject(acp)
    .then(() => next())
    .catch(error => next(error));
};

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
