"use strict";

// Setting the logs
const log4js = require("log4js");
const logger = log4js.getLogger("[dcd-api-http:auth]");
logger.level = process.env.LOG_LEVEL || "INFO";

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
  // Check and extract the token from the header
  if (req.get("Authorization") === undefined) {
    return next(
      new Error("Request not allowed " + '- Missing "Authorization" header.')
    );
  }
  const token = req.get("Authorization").replace(/bearer\s/gi, "");
  return model.auth.refresh().then(() => {
    // Token with 3 dots are JWT
    if (token.split(".").length === 3 && req.params.entityId !== undefined) {
      return model.auth
        .checkJWTAuth(token, req.params.entityId)
        .then(token => {
          req.entityType = req.params.entity;
          req.user = { entityId: req.params.entityId, token: token, sub: "dcd:things:" + req.params.entityId };
          logger.info('introspect thing result, req.user:');
          logger.info(req.user);
          next();
        })
        .catch(error => {
          logger.error(error);
          next(error);
        });
    } else {
      // Otherwise it is a Bearer token
      return model.auth
        .introspect(token)
        .then(user => {
          req.entityType = req.params.entity;
          req.user = user;
          next();
        })
        .catch(error => {
          logger.error(error);
          next(error);
        });
    }
  });
};

exports.wardenToken = ({ resource, action, scope = [] }) => (
  req,
  res,
  next
) => {
  let acpResource = "dcd";
  if (req.params.entity !== undefined) {
    acpResource += ":" + req.params.entity;
  }
  if (req.params.entityId !== undefined) {
    acpResource += ":" + req.params.entityId;
  }
  if (req.params.component !== undefined) {
    acpResource += ":" + req.params.component;
  }
  if (req.params.propertyId !== undefined) {
    acpResource += ":" + req.params.entityId;
  }

  const token = req.get("Authorization").replace(/bearer\s/gi, "");

  const acp = {
    resource: acpResource,
    action: "dcd:actions:" + action,
    scope: scope,
    token: token
  };

  if (token.split(".").length === 3 && req.params.entityId !== undefined) {
    acp.subject = "dcd:things:" + req.params.entityId;
    model.auth
      .checkJWT(acp, req.params.entityId)
      .then(user => {
        if (user !== undefined) {
          req.user = user;
          next();
        } else {
          next(new Error("Not Allowed"));
        }
      })
      .catch(error => {
        next(error);
      });
  } else {
    model.auth
      .wardenToken(acp)
      .then(user => {
        req.user = user;
        next();
      })
      .catch(error => {
        next(error);
      });
  }
};

exports.wardenSubject = ({ resource, action }) => (req, res, next) => {
  logger.info("warden subject, acp:");
  let acpResource = "dcd:" + resource;
  if (req.params.entity !== undefined) {
    acpResource += ":" + req.params.entity;
  }
  if (req.params.entityId !== undefined) {
    acpResource += ":" + req.params.entityId;
  }
  if (req.params.component !== undefined) {
    acpResource += ":" + req.params.component;
  }
  if (req.params.propertyId !== undefined) {
    acpResource += ":" + req.params.entityId;
  }
  const acp = {
    resource: acpResource,
    action: "dcd:actions:" + action,
    subject: req.user.sub
  };
  logger.info(acp);
  model.auth
    .wardenSubject(acp)
    .then(result => {
      logger.info("warden subject positive response, continue ");
      logger.info(result);
      next();
    })
    .catch(error => {
      logger.error("warden subject negative response");
      logger.error(error);
      next(error);
    });
};
