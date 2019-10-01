"use strict";

const fs = require("fs");
const path = require("path");
const multer = require("multer");
const multiparty = require("multiparty");

const API = require("./API");
const DCDError = require("dcd-model/lib/Error");
const Property = require("dcd-model/entities/Property");

/**
 * PropertyAPI provides the routes for managing Properties of the DCD Hub.
 * A Property represents a Thing or Person property.
 */
class PropertyAPI extends API {
  constructor(model) {
    super(model);
  }

  init() {
    /**
     * Add the entity Type to all request of this router.
     */
    this.router.use((req, res, next) => {
      this.logger.debug("Property route");
      req.entityType = req.params.entity;
      next();
    });

    /**
     * @api {post} /things|persons/:entityId/properties Create
     * @apiGroup Property
     * @apiDescription Create a Property.
     *
     * @apiVersion 0.1.0
     *
     * @apiParam {String} entityId Id of the Thing or Person to which we add the Property.
     *
     * @apiParam (Body) {Property} property Property to create as JSON.
     * @apiParamExample {json} property:
     *     {
     *       "name": "My Property",
     *       "description": "A description of my property.",
     *       "type": "PROPERTY_TYPE"
     *     }
     *
     * @apiHeader {String} Content-type application/json
     * @apiHeader {String} Authorization TOKEN ID
     *
     * @apiSuccess {object} interaction The created Property
     */
    this.router.post(
      [
        "/:entity(things|persons)/:entityId/:component(properties)",
        "/:entity(things|persons)/:entityId/interactions/:interactionId/:component(properties)"
      ],
      this.introspectToken([]),
      this.checkPolicy("properties", "create"),
      (request, response, next) => {
        this.logger.debug("POST properties");
        if (request.params.interactionId !== undefined) {
          // Looking for an interaction property
          request.body.entityId = request.params.interactionId;
        } else {
          // Looking for a Person/Thing property
          request.body.entityId = request.params.entityId;
        }
        this.logger.debug(request.body);
        this.logger.debug(new Property(request.body));
        this.model.properties
          .create(new Property(request.body))
          .then(result => this.success(response, { property: result }, 201))
          .catch(error => next(error));
      }
    );

    /**
     * @api {get} /things|persons/:entityId/properties List
     * @apiGroup Property
     * @apiDescription List Properties.
     *
     * @apiVersion 0.1.0
     *
     * @apiHeader {String} Authorization TOKEN ID
     *
     * @apiParam {String} entityId Id of the Thing or Person containing the Properties.
     *
     * @apiSuccess {object} properties The retrieved Properties
     */
    this.router.get(
      [
        "/:entity(things|persons)/:entityId/:component(properties)",
        "/:entity(things|persons)/:entityId/interactions/:interactionId/:component(properties)"
      ],
      this.introspectToken([]),
      this.checkPolicy("properties", "list"),
      (request, response, next) => {
        let entityId = request.params.entityId;
        if (request.params.interactionId !== undefined) {
          entityId = request.params.interactionId;
        }
        this.model.properties
          .list(entityId)
          .then(result => {
            this.logger.info(result);
            this.success(response, { properties: result }, 200);
          })
          .catch(error => next(error));
      }
    );

    /**
     * @api {get} /things|persons/:entityId/properties/:propertyId Read
     * @apiGroup Property
     * @apiDescription Read a Property.
     *
     * @apiVersion 0.1.0
     *
     * @apiHeader {String} Authorization TOKEN ID
     *
     * @apiParam {String} entityId   Id of the Thing or Person containing the property.
     * @apiParam {String} propertyId Id of the Property to read.
     *
     * @apiParam (Query) {Number} [from] Start time to get historical values, UNIX timestamp (in ms)
     * @apiParam (Query) {Number} [to] End time to get historical values, UNIX timestamp (in ms)
     *
     * @apiSuccess {object} thing The retrieved Property
     */
    this.router.get(
      [
        "/:entity(things|persons)/:entityId/:component(properties)/:propertyId",
        "/:entity(things|persons)/:entityId/interactions/:interactionId/:component(properties)/:propertyId"
      ],
      this.introspectToken([]),
      this.checkPolicy("things", "read"),
      (request, response, next) => {
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
        this.model.properties
          .read(entityId, propertyId, from, to)
          .then(result => {
            this.logger.debug(result);
            return this.success(response, { property: result }, 200);
          })
          .catch(error => next(error));
      }
    );

    /**
     * @api {put} /things|persons/:entityId/properties/:propertyId Update
     * @apiGroup Property
     * @apiDescription Update a Property.
     *
     * @apiVersion 0.1.0
     *
     * @apiParam {String} entityId   Id of the Thing or Person containing the property.
     * @apiParam {String} propertyId Id of the Property to update.
     */
    this.router.put(
      [
        "/:entity(things|persons)/:entityId/:component(properties)/:propertyId",
        "/:entity(things|persons)/:entityId/interactions/:interactionId/:component(properties)/:propertyId"
      ],
      this.introspectToken([]),
      this.checkPolicy("properties", "update"),
      (request, response, next) => {
        const propertyId = request.params.propertyId;
        const contentType = request.headers["content-type"];
        if (contentType.indexOf("application/json") === 0) {
          // Look for data in the body
          const property = new Property(request.body);
          property.entityId = request.params.entityId;
          if (property.id !== propertyId) {
            return next(
              new DCDError(
                400,
                "The property id in the request path is not matching with the id provided in the request body."
              )
            );
          }
          return this.update(property, request, response, next);
        } else if (contentType.indexOf("multipart/form-data") === 0) {
          // Look for data in a CSV file
          const property = new Property({
            id: propertyId,
            entityId: request.params.entityId
          });
          return this.uploadDataFile(property, request, response, next);
        }
        // No json body nor data file.
        return next(
          new DCDError(
            404,
            "Could not find data in the body as JSON (Content-Type: application/json) nor in a data file (Content-Type: multipart/form-data)."
          )
        );
      }
    );

    /**
     * @api {put} /things|persons/:entityId/properties/:propertyId/values/:values Update
     * @apiGroup Property
     * @apiDescription Update a Property with a file (e.g. video).
     *
     * @apiVersion 0.1.0
     *
     * @apiParam {String} entityId   Id of the Thing or Person containing the property.
     * @apiParam {String} propertyId Id of the Property to update.
     * @apiParam {String} values Comma-separated values to associate to the file.
     */
    this.router.put(
      [
        "/:entity(things|persons)/:entityId/:component(properties)/:propertyId/values/:values",
        "/:entity(things|persons)/:entityId/interactions/:interactionId/:component(properties)/:propertyId/values/:values"
      ],
      this.introspectToken([]),
      this.checkPolicy("properties", "update"),
      (request, response, next) => {
        const values = request.params.values.split(",").map(Number);
        let entityId = request.params.entityId;
        if (request.params.interactionId !== undefined) {
          entityId = request.params.interactionId;
        }
        const property = new Property({
          id: request.params.propertyId,
          values: [values],
          entityId: entityId
        });
        this.update(property, request, response, next);
      }
    );

    /**
     * @api {get} /things/thingId Read file
     * @apiGroup Property
     * @apiDescription Read file attach to a property value.
     *
     * @apiVersion 0.1.0
     *
     * @apiHeader {String} Authorization TOKEN ID
     *
     * @apiParam {String} entityId   Id of the Thing or Person containing the property.
     * @apiParam {String} propertyId Id of the Property to read.
     * @apiParam {Number} ts         Timestamp of the value associated with the file to retrieve (UNIX, in ms)
     */
    this.router.get(
      [
        "/:entity(things|persons)/:entityId/:component(properties)/:propertyId/values/:ts",
        "/:entity(things|persons)/:entityId/interactions/:interactionId/:component(properties)/:propertyId/values/:ts"
      ],
      this.introspectToken([]),
      this.checkPolicy("properties", "read"),
      (request, response, next) => {
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
     * @api {get} /things|persons/:entityId/properties/:propertyId/classes Create Class
     * @apiGroup Property
     * @apiDescription Attach a list of class names (labels) to a property of type CLASS
     *
     * @apiVersion 0.1.0
     *
     * @apiHeader {String} Authorization TOKEN ID
     * @apiHeader {String} Content-type application/json
     *
     * @apiParam {String} entityId   Id of the Thing or Person containing the property.
     * @apiParam {String} propertyId Id of the Property to read.
     * @apiParam (Body) {object} object Object containing an array of class names.
     * @apiParamExample {json} classes:
     *     {
     *        classes: ["Class name 1", "Class name 2", "Class name n"]
     *     }
     */
    this.router.post(
      [
        "/:entity(things|persons)/:entityId/:component(properties)/:componentId/classes",
        "/:entity(things|persons)/:entityId/interactions/:interactionId/:component(properties)/:componentId/classes"
      ],
      this.introspectToken([]),
      this.checkPolicy("classes", "create"),
      (request, response, next) => {
        if (
          request.body.classes === undefined ||
          request.body.classes.length === 0
        ) {
          return next(new DCDError(4009, "Missing or empty classes array"));
        }
        this.model.properties
          .createClasses(
            request.params.entityId,
            request.params.componentId,
            request.body.classes
          )
          .then(result => this.success(response, { classes: result }, 201))
          .catch(error => next(error));
      }
    );

    /**
     * @api {delete} /things|persons/:entityId/properties/:propertyId Delete
     * @apiGroup Property
     * @apiDescription Delete a Property.
     *
     * @apiVersion 0.1.0
     *
     * @apiHeader {String} Authorization TOKEN ID
     *
     * @apiParam {String} entityId   Id of the Thing or Person containing the property.
     * @apiParam {String} propertyId Id of the Property to delete.
     */
    this.router.delete(
      [
        "/:entity(things|persons)/:entityId/:component(properties)/:propertyId",
        "/:entity(things|persons)/:entityId/interactions/:interactionId/:component(properties)/:propertyId"
      ],
      this.introspectToken([]),
      this.checkPolicy("properties", "delete"),
      (request, response, next) => {
        const propertyId = request.params.propertyId;
        this.model.properties
          .del(propertyId)
          .then(result => {
            if (result.affectedRows > 0) {
              this.success(
                response,
                {
                  message: result.affectedRows + " Property deleted."
                },
                204
              );
            } else {
              next(
                new DCDError(
                  404,
                  "Property to delete " +
                    propertyId +
                    " could not be not found."
                )
              );
            }
          })
          .catch(error => next(error));
      }
    );
  }

  update(property, request, response, next) {
    this.model.properties
      .update(property)
      .then(() => {
        return this.model.properties.updateValues(property);
      })
      .then(result => {
        const payload = {};
        if (result !== undefined) {
          payload.values = result;
        }
        if (request.files === undefined || request.files.video === undefined) {
          payload.file = false;
          return this.success(response, payload, 200);
        }
        upload(request, response, error => {
          if (error) {
            return next(error);
          } else {
            if (request.file === undefined) {
              return next(new DCDError(4042, "The file to upload is missing."));
            } else {
              payload.file = true;
              return this.success(response, payload, 200);
            }
          }
        });
      })
      .catch(error => next(error));
  }

  uploadDataFile(property, request, response, next) {
    const form = new multiparty.Form();
    let dataStr = "";
    // listen on part event for data file
    form.on("part", part => {
      if (!part.filename) {
        return;
      }
      part.on("data", buf => {
        dataStr += buf.toString();
      });
    });
    form.on("close", () => {
      const propertyWithValues = updatePropertyFromCSVStr(
        property.entityId,
        property.id,
        dataStr
      );
      this.update(propertyWithValues, request, response, next);
    });
    form.on("error", next);
    form.parse(request);
  }
}

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
}).single("media");

// Check File Type
function checkFileType(file, cb) {
  // Allowed ext
  const filetypes = /mp4|jpeg|jpg|mp3/;
  // Check ext
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new DCDError(400, "MP4, MP3 and JPEG Only!"));
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

module.exports = PropertyAPI;
