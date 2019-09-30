"use strict";

const express = require("express");
const path = require("path");
const favicon = require("serve-favicon");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");

const winston = require("winston");
const expressWinston = require("express-winston");

const app = express();

app.use(
  expressWinston.logger({
    level: process.env.LOG_LEVEL || "info",
    transports: [
      // Write to all logs with level `info` and below to `combined.log`
      new winston.transports.File({
        filename: "logs/error.log",
        level: "error"
      }),
      // Write all logs error (and below) to `error.log`.
      new winston.transports.File({ filename: "logs/combined.log" })
    ],
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.json()
    ),
    // Use the default Express/morgan request formatting. Enabling this will override
    // any msg if true. Will only output colors with colorize set to true
    expressFormat: true,
    // Color the text and status code, using the Express/morgan color palette
    // (text: gray, status: default green, 3XX cyan, 4XX yellow, 5XX red).
    colorize: true
  })
);

// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
// if (process.env.NODE_ENV !== "production") {
//   logger.add(
//
//
//   );
// }

const baseUrl = process.env.BASE_URL || "/api";

app.use(favicon(path.join(__dirname, "public", "favicon.ico")));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(baseUrl, express.static(path.join(__dirname, "public")));

const DCDModel = require("dcd-model");
const DCDError = require("dcd-model/lib/Error");

// test

const model = new DCDModel();
model.init();

const swStats = require("swagger-stats");
app.use(baseUrl, swStats.getMiddleware());

app.use(cors());

const HealthAPI = require("./routes/health");
const healthAPI = new HealthAPI(model);
app.use(baseUrl + "/health", healthAPI.router);

const PersonAPI = require("./routes/persons");
const personAPI = new PersonAPI(model);
app.use(baseUrl + "/persons", personAPI.router);

const ThingAPI = require("./routes/things");
const thingAPI = new ThingAPI(model);
app.use(baseUrl + "/things", thingAPI.router);

const PropertyAPI = require("./routes/properties");
const propertyAPI = new PropertyAPI(model);
app.use(baseUrl, propertyAPI.router);

const StatAPI = require("./routes/stats");
const statAPI = new StatAPI(model);
app.use(baseUrl + "/stats", statAPI.router);

const InteractionAPI = require("./routes/interactions");
const interactionAPI = new InteractionAPI(model);
app.use(baseUrl, interactionAPI.router);

const RoleAPI = require("./routes/roles");
const roleAPI = new RoleAPI(model);
app.use(baseUrl, roleAPI.router);

// Catch 404 and forward to error handler
app.use((request, response, next) => {
  next(new DCDError(404, "Path not found: " + request.path));
});

app.use(
  expressWinston.errorLogger({
    transports: [new winston.transports.Console()],
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.json()
    )
  })
);

// Error handler

app.use((error, request, response, next) => {
  let errorResponse = {};
  if (error instanceof DCDError) {
    // logger.error(JSON.stringify(error));
    errorResponse = error;
  } else {
    // logger.error(JSON.stringify(error, Object.getOwnPropertyNames(error)));
    errorResponse = new DCDError(
      error.code || error.status || 500,
      error.message
    );
  }
  response.status(error.status);
  response.set({ "Content-Type": "application/json" });
  response.json(errorResponse);
});

module.exports = app;
