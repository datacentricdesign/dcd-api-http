"use strict";

const express = require("express");
const path = require("path");
const favicon = require("serve-favicon");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");

// Setting the logs
const log4js = require("log4js");
const logger = log4js.getLogger("[dcd-api-http:app]");
logger.level = process.env.LOG_LEVEL || "INFO";

const baseUrl = process.env.BASE_URL || "/api";

const app = express();

app.use(favicon(path.join(__dirname, "public", "favicon.ico")));
app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(baseUrl, express.static(path.join(__dirname, "public")));

const DCDModel = require("dcd-model");

// test

const model = new DCDModel();
model.init();

const auth = require("./auth");
auth.setModel(model);
const swStats = require("swagger-stats");
app.use(baseUrl, swStats.getMiddleware());

app.use(cors());


const HealthAPI = require("./routes/health");
const healthAPI = new HealthAPI(model, auth);
app.use(baseUrl + "/health", healthAPI.router);

const PersonAPI = require("./routes/persons");
const personAPI = new PersonAPI(model, auth);
app.use(baseUrl + "/persons", personAPI.router);

const ThingAPI = require("./routes/things");
const thingAPI = new ThingAPI(model, auth);
app.use(baseUrl + "/things", thingAPI.router);

const PropertyAPI = require("./routes/properties");
const propertyAPI = new PropertyAPI(model, auth);
app.use(baseUrl, propertyAPI.router);

const StatAPI = require("./routes/stats");
const statAPI = new StatAPI(model, auth);
app.use(baseUrl + "/stats", statAPI.router);

const InteractionAPI = require("./routes/interactions");
const interactionAPI = new InteractionAPI(model, auth);
app.use(baseUrl, interactionAPI.router);

// Catch 404 and forward to error handler
app.use(function(request, response, next) {
  const err = new Error("Not Found");
  err.status = 404;
  next(err);
});

// Error handler

app.use((error, request, response, next) => {
  logger.error(error);
  response.status(error.status || 500);
  const errorResponse = { message: error.message};
  if (error.code !== undefined) {
    errorResponse.code = error.code;
  } else if (error.status !== undefined) {
    errorResponse.code = error.status;
  }
  response.json(errorResponse);
});

module.exports = app;
