"use strict";

const express = require("express");
const path = require("path");
const favicon = require("serve-favicon");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const fs = require("fs");
const cors = require("cors");

const multer = require("multer");

// Setting the logs
const log4js = require("log4js");
const logger = log4js.getLogger("[dcd-api-http:app]");
logger.level = process.env.LOG_LEVEL || "INFO";

const utils = require("./utils/writer.js");

const baseUrl = process.env.BASE_URL || "/api";

const app = express();

app.use(favicon(path.join(__dirname, "public", "favicon.ico")));
app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

const DCDModel = require("dcd-model");
const Thing = require("dcd-model/entities/Thing");
const Interaction = require("dcd-model/entities/Interaction");
const Person = require("dcd-model/entities/Person");
const Property = require("dcd-model/entities/Property");

const model = new DCDModel();
model.init();

const auth = require("./auth");
auth.setModel(model);
const swStats = require("swagger-stats");
app.use(baseUrl, swStats.getMiddleware());

app.use(cors());

const success = (response, result) => {
  logger.debug(result);
  utils.writeJson(response, result);
};

const fail = (response, error) => {
  logger.error(error);
  utils.writeJson(response, error);
};

/**
 * API Health status
 */
app.get(baseUrl + "/health", (request, response) => {
  success(response, { status: 0, message: "OK" });
});

/**
 * Create a person.
 */
app.post(baseUrl + "/:entity(persons)", (request, response) => {
  const person = new Person(request.body);
  model.persons
    .create(person)
    .then(result => success(response, { personId: result }))
    .catch(error => fail(response, error));
});

/**
 * List Persons.
 */
app.get(
  baseUrl + "/:entity(persons)",
  auth.introspect,
  auth.wardenSubject({ resource: "persons", action: "list" }),
  (request, response) => {
    model.persons
      .list(request.user.sub)
      .then(result => success(response, result))
      .catch(error => fail(response, error));
  }
);

/**
 * Read a Person.
 */
app.get(
  baseUrl + "/:entity(persons)/:entityId",
  auth.introspect,
  auth.wardenSubject({ resource: "persons", action: "read" }),
  (request, response) => {
    model.persons
      .read(request.params.entityId)
      .then(result => success(response, { person: result }))
      .catch(error => fail(response, error));
  }
);

/**
 * Check a Person's credentials.
 */
app.post(
  baseUrl + "/:entity(persons)/:entityId/check",
  auth.introspect,
  // auth.wardenToken({
  //     resource: 'persons',
  //     scope: ['dcd:auth'], action: 'check'
  // }),
  (request, response) => {
    if (request.body !== undefined && request.body.password !== undefined) {
      model.persons
        .check(request.params.entityId, request.body.password)
        .then(result => success(response, { person: result }))
        .catch(error => fail(response, error));
    }
  }
);

/**
 * Update a Person.
 */
app.put(
  baseUrl + "/:entity(persons)/:entityId",
  auth.introspect,
  auth.wardenSubject({ resource: "persons", action: "update" }),
  (request, response) => {
    const person = new Person(request.params.entityId, request.body);
    model.persons
      .update(person)
      .then(result => success(response, result))
      .catch(error => fail(response, error));
  }
);

/**
 * Delete a Person.
 */
app.delete(
  baseUrl + "/:entity(persons)/:entityId",
  auth.introspect,
  auth.wardenSubject({ resource: "persons", action: "delete" }),
  (request, response) => {
    const personId = request.params.entityId;
    model.persons
      .delete(personId)
      .then(result => success(response, result))
      .catch(error => fail(response, error));
  }
);

/**
 * Create a Thing.
 *
 * @property {String} request.query.jwt (true|false, default: false)
 *           Need to generate a JWT
 * @property {Boolean} request.query.thingId (optional, default: undefined)
 *           Forward to update (Web forms cannot submit PUT methods)
 * @property {Thing} request.body
 */
app.post(
  baseUrl + "/:entity(things)",
  auth.introspect,
  auth.wardenSubject({ resource: "things", action: "create" }),
  (request, response) => {
    // Web forms cannot submit PUT methods, we check the flag update
    if (request.query.thingId !== undefined) {
      request.body.entityId = request.query.thingId;
      return model.things
        .update(new Thing(request.body))
        .then(result => success(response, result))
        .catch(error => fail(response, error));
    }

    const personId = request.user.sub;
    const thing = new Thing(request.body);
    const jwt =
      request.query.jwt !== undefined ? request.query.jwt === "true" : false;
    model.things
      .create(personId, thing, jwt)
      .then(result => success(response, { thing: result }))
      .catch(error => fail(response, error));
  }
);

/**
 * List Things.
 */
app.get(
  baseUrl + "/:entity(things)",
  auth.introspect,
  auth.wardenSubject({ resource: "things", action: "list" }),
  (request, response) => {
    model.things
      .list(request.user.sub)
      .then(result => success(response, { things: result }))
      .catch(error => fail(response, error));
  }
);

/**
 * Read a Thing.
 */
app.get(
  baseUrl + "/:entity(things)/:entityId",
  auth.introspect,
  auth.wardenSubject({ resource: "things", action: "read" }),
  (request, response) => {
    model.things
      .read(request.params.entityId)
      .then(result => {
        success(response, { thing: result });
      })
      .catch(error => fail(response, error));
  }
);

/**
 * Update a Thing.
 */
app.put(
  baseUrl + "/:entity(things)/:entityId",
  auth.introspect,
  auth.wardenSubject({ resource: "things", action: "update" }),
  (request, response) => {
    model.things
      .update(new Thing(request.body, request.params.entityId))
      .then(result => success(response, result))
      .catch(error => fail(response, error));
  }
);

/**
 * Delete a Thing.
 */
app.delete(
  baseUrl + "/:entity(things)/:entityId",
  auth.introspect,
  auth.wardenSubject({ resource: "things", action: "delete" }),
  (request, response) => {
    model.things
      .del(request.params.entityId)
      .then(result => success(response, result))
      .catch(error => fail(response, error));
  }
);

/**
 * Create Classes.
 */
app.post(
  baseUrl +
    "/:entity(things|persons)/:entityId/:component(properties)/:componentId/classes",
  auth.introspect,
  auth.wardenSubject({ resource: "classes", action: "create" }),
  (request, response) => {
    if (
      request.body.classes === undefined ||
      request.body.classes.length === 0
    ) {
      return fail(response, { msg: "Missing or empty classes array" });
    }
    model.properties
      .createClasses(
        request.params.entityId,
        request.params.componentId,
        request.body.classes
      )
      .then(result => success(response, { classes: result }))
      .catch(error => fail(response, error));
  }
);

const propertyRouter = express.Router();

/**
 * Create a Property.
 */
propertyRouter.post(
  [
    "/:entity(things|persons)/:entityId/:component(properties)",
    "/:entity(things|persons)/:entityId/interactions/:interactionId/:component(properties)"
  ],
  auth.introspect,
  auth.wardenSubject({ resource: "properties", action: "create" }),
  (request, response) => {
    if (request.params.interactionId !== undefined) {
      request.body.entityId = request.params.interactionId;
    } else {
      request.body.entityId = request.params.entityId;
    }
    logger.debug(request.body);
    logger.debug(new Property(request.body));
    model.properties
      .create(new Property(request.body))
      .then(result => success(response, { property: result }))
      .catch(error => fail(response, error));
  }
);

/**
 * List Properties.
 */
propertyRouter.get(
  [
    "/:entity(things|persons)/:entityId/:component(properties)",
    "/:entity(things|persons)/:entityId/interactions/:interactionId/:component(properties)"
  ],
  auth.introspect,
  auth.wardenSubject({ resource: "properties", action: "list" }),
  (request, response) => {
    let entityId = request.params.entityId;
    if (request.params.interactionId !== undefined) {
      entityId = request.params.interactionId;
    }
    model.properties
      .list(entityId)
      .then(result => {
        logger.info(result);
        success(response, { properties: result });
      })
      .catch(error => fail(response, error));
  }
);

/**
 * Read a Property.
 *
 * Optional parameters:
 * - from: start time to get historical values, UNIX timestamp (in ms)
 * - to: end time to get historical values, UNIX timestamp (in ms)
 */
propertyRouter.get(
  [
    "/:entity(things|persons)/:entityId/:component(properties)/:propertyId",
    "/:entity(things|persons)/:entityId/interactions/:interactionId/:component(properties)/:propertyId"
  ],
  auth.introspect,
  auth.wardenSubject({ resource: "things", action: "read" }),
  (request, response) => {
    let entityId = request.params.entityId;
    if (request.params.interactionId !== undefined) {
      entityId = request.params.interactionId;
    }
    const propertyId = request.params.propertyId;
    let from;
    let to;
    if (request.query.from !== undefined) {
      from = parseInt(request.query.from);
    }
    if (request.query.to !== undefined) {
      to = parseInt(request.query.to);
    }
    model.properties
      .read(entityId, propertyId, from, to)
      .then(result => {
        logger.debug(result);
        return success(response, { property: result });
      })
      .catch(error => fail(response, error));
  }
);

/**
 * Update a property.
 */
propertyRouter.put(
  [
    "/:entity(things|persons)/:entityId/:component(properties)/:propertyId",
    "/:entity(things|persons)/:entityId/interactions/:interactionId/:component(properties)/:propertyId"
  ],
  auth.introspect,
  auth.wardenSubject({ resource: "properties", action: "update" }),
  (request, response) => {
    const propertyId = request.params.propertyId;
    const property = request.body;
    if (property.id === propertyId) {
      model.properties
        .updateValues(property)
        .then(() => {
          if (
            request.files === undefined ||
            request.files.video === undefined
          ) {
            return success(response, property);
          }
          upload(request, response, error => {
            if (error) {
              return fail(response, error);
            } else {
              if (request.file === undefined) {
                return fail(response, { error: "Missing file." });
              } else {
                return success(response, { success: true });
              }
            }
          });
        })
        .catch(error => fail(response, error));
    } else {
      fail(response, { message: "property id not matching" });
    }
  }
);

/**
 * Update a property.
 */
propertyRouter.post(
  [
    "/:entity(things|persons)/:entityId/:component(properties)/:propertyId/values/:values/file",
    "/:entity(things|persons)/:entityId/interactions/:interactionId/:component(properties)/:propertyId/values/:values/file"
  ],
  auth.introspect,
  auth.wardenSubject({ resource: "properties", action: "update" }),
  (request, response) => {
    const values = request.params.values.split(",").map(Number);
    let entityId = request.params.entityId;
    if (request.params.interactionId !== undefined) {
      entityId = request.params.interactionId;
    }
    model.dao
      .readProperty(entityId, request.params.propertyId)
      .then(property => {
        property.values = [values];
        return model.dao.updatePropertyValues(property);
      })
      .then(() => {
        upload(request, response, error => {
          if (error) {
            return fail(response, error);
          } else {
            if (request.file === undefined) {
              return fail(response, { error: "Missing file." });
            } else {
              return success(response, { success: true });
            }
          }
        });
      })
      .catch(error => fail(response, error));
  }
);

/**
 * Update a property with a CSV file of values.
 */
propertyRouter.put(
  [
    "/:entity(things|persons)/:entityId/:component(properties)/:propertyId/file",
    "/:entity(things|persons)/:entityId/interactions/:interactionId/:component(properties)/:propertyId/file"
  ],
  auth.introspect,
  auth.wardenSubject({ resource: "properties", action: "update" }),
  (request, response, next) => {
    let entityId = request.params.entityId;
    if (request.params.interactionId !== undefined) {
      entityId = request.params.interactionId;
    }
    const propertyId = request.params.propertyId;

    const form = new multiparty.Form();
    let dataStr = "";

    form.on("error", next);
    form.on("close", () => {
      const property = updatePropertyFromCSVStr(entityId, propertyId, dataStr);
      model.properties
        .update(entityId, propertyId, property)
        .then(result => success(response, result))
        .catch(error => fail(response, error));
    });

    // listen on part event for data file
    form.on("part", part => {
      if (!part.filename) {
        return;
      }
      part.on("data", buf => {
        dataStr += buf.toString();
      });
    });
    form.parse(request);
  }
);

/**
 * Delete a property.
 */
propertyRouter.delete(
  [
    "/:entity(things|persons)/:entityId/:component(properties)/:propertyId",
    "/:entity(things|persons)/:entityId/interactions/:interactionId/:component(properties)/:propertyId"
  ],
  auth.introspect,
  auth.wardenSubject({ resource: "properties", action: "delete" }),
  (request, response) => {
    model.properties
      .del(request.params.propertyId)
      .then(result => {
        if (result.affectedRows === 1) {
          success(response, { success: true });
        } else {
          fail(response, { error: "Property to delete not found" });
        }
      })
      .catch(error => fail(response, error));
  }
);

app.use(baseUrl, propertyRouter);

/**
 * Get video
 */
app.get(
  baseUrl +
    "/:entity(things|persons)/:entityId/:component(properties)/:propertyId/values/:ts",
  auth.introspect,
  (request, response) => {
    const path =
      "./files/" +
      request.params.entityId +
      "-" +
      request.params.propertyId +
      "-" +
      request.params.ts +
      ".mp4";
    const stat = fs.statSync(path);
    const fileSize = stat.size;
    const range = request.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      const chunksize = end - start + 1;
      const file = fs.createReadStream(path, { start, end });
      const head = {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunksize,
        "Content-Type": "video/mp4"
      };

      response.writeHead(206, head);
      file.pipe(response);
    } else {
      const head = {
        "Content-Length": fileSize,
        "Content-Type": "video/mp4"
      };
      response.writeHead(200, head);
      fs.createReadStream(path).pipe(response);
    }
  }
);

/**
 * Create an interaction.
 *
 * Body:
 * - entity_id_1: id of the first interacting thing
 * - entity_id_2: id of the second interacting thing
 */
app.post(
  baseUrl + "/:entity(things|persons)/:entityId/:component(interactions)",
  auth.introspect,
  auth.wardenSubject({ resource: "interactions", action: "create" }),
  (request, response) => {
    if (
      request.body === undefined ||
      (request.body.entity_id_1 !== request.params.entityId &&
        request.body.entity_id_2 !== request.params.entityId)
    ) {
      return fail(
        new Error(
          "Missing body with entityId1 and entityId2," +
            " or mismatch with requester thing id."
        )
      );
    }
    const interaction = new Interaction(request.body);
    model.interactions
      .create(interaction)
      .then(result => success(response, { interaction: result }))
      .catch(error => fail(response, error));
  }
);

/**
 * List interactions
 */
app.get(
  baseUrl + "/:entity(things|persons)/:entityId/:component(interactions)",
  auth.introspect,
  auth.wardenSubject({ resource: "interactions", action: "list" }),
  (request, response) => {
    let entityDestId;
    if (request.query.entity !== undefined) {
      entityDestId = parseInt(request.query.entity);
    }
    model.interactions
      .list(request.user.sub, request.params.entityId, entityDestId)
      .then(result => success(response, result))
      .catch(error => fail(response, error));
  }
);

/**
 * Read an interaction
 */
app.get(
  baseUrl +
    "/:entity(things|persons)/:entityId/:component(interactions)/:componentId",
  auth.introspect,
  auth.wardenSubject({ resource: "interactions", action: "read" }),
  (request, response) => {
    model.interactions
      .read(request.params.componentId)
      .then(result => success(response, { interaction: result }))
      .catch(error => fail(response, error));
  }
);

/**
 * Get stats property type stats
 * Optional parameters:
 * - from: start time to get historical values, UNIX timestamp (in ms)
 * - to: end time to get historical values, UNIX timestamp (in ms)
 */

 app.get(
   baseUrl +
    "/stats/:propertyType",
    auth.introspect,
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
    model.stats
      .getTypeStats(propertyType, from, to)
      .then(result => {
        logger.debug(result);
        return success(response, { stat: result });
      })
      .catch(error => fail(response, error));
    }
 );



// Set The Storage Engine
const storage = multer.diskStorage({
  destination: "./files/",
  filename: function(req, file, cb) {
    const entityId = req.params.entityId;
    const propertyId = req.params.propertyId;
    const values = req.params.values.split(",").map(Number);
    cb(
      null,
      entityId +
        "-" +
        propertyId +
        "-" +
        values[0] +
        path.extname(file.originalname).toLowerCase()
    );
  }
});

// Init Upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 1000000000 },
  fileFilter: function(req, file, cb) {
    checkFileType(file, cb);
  }
}).single("video");

// Check File Type
function checkFileType(file, cb) {
  // Allowed ext
  const filetypes = /mp4/;
  // Check ext
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb("Error: MP4 video Only!");
  }
}

/**
 *
 * @param entityId
 * @param propertyId
 * @param csvStr
 * @returns {{id: *, values: Array}}
 */
function updatePropertyFromCSVStr(entityId, propertyId, csvStr) {
  const property = {
    id: propertyId,
    values: []
  };
  csvStr.split("\n").forEach(line => {
    if (line !== "") {
      property.values.push(line.split(",").map(Number));
    }
  });
  return property;
}

// catch 404 and forward to error handler
app.use(function(request, response, next) {
  const err = new Error("Not Found");
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get("env") === "development") {
  app.use((error, request, response) => {
    response.status(error.status || 500);
    response.json({
      message: error.message,
      error: error
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use((error, request, response) => {
  response.status(error.status || 500);
  response.json({
    message: error.message,
    error: {}
  });
});

module.exports = app;
