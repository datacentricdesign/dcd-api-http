"use strict";

const API = require("./API");
const Interaction = require("@datacentricdesign/model/entities/Interaction");
const DCDError = require("dcd-model/lib/Error");

/**
 * InteractionAPI provides the routes for managing Interactions of the DCD Hub.
 */
class InteractionAPI extends API {
  constructor(model) {
    super(model);
  }

  init() {
    /**
     * Add the entity Type to all request of this router.
     */
    this.router.use((req, res, next) => {
      req.entityType = req.params.entity;
      next();
    });

    /**
     * @api {post} /things|persons/:entityId/interactions Create
     * @apiGroup Interaction
     * @apiDescription Create an Interaction.
     *
     * @apiVersion 0.0.0
     * @apiIgnore Still under development.
     *
     * @apiParam {String} entityId Id of one of the Thing or Person taking part in the interaction.
     *
     * @apiParam (Body) {Interaction} interaction Interaction to create as JSON.
     * @apiParamExample {json} interaction:
     *     {
     *       "entity_id_1": "id of the first interacting thing",
     *       "entity_id_2": "id of the second interacting thing"
     *     }
     *
     * @apiHeader {String} Content-type application/json
     * @apiHeader {String} Authorization TOKEN ID
     *
     * @apiSuccess {object} interaction The created Interaction
     */
    this.router.post(
      "/:entity(things|persons)/:entityId/:component(interactions)",
      request => {
        this.introspectToken([request.params.entity]);
      },
      this.checkPolicy({ resource: "interactions", action: "create" }),
      (request, response, next) => {
        if (
          request.body === undefined ||
          (request.body.entity_id_1 !== request.params.entityId &&
            request.body.entity_id_2 !== request.params.entityId)
        ) {
          return next(
            new DCDError(
              4008,
              "Missing body with entityId1 and entityId2," +
                " or mismatch with requester thing id."
            )
          );
        }
        const interaction = new Interaction(request.body);
        this.model.interactions
          .create(interaction)
          .then(result => this.success(response, { interaction: result }))
          .catch(error => next(error));
      }
    );

    /**
     * @api {get} /things|persons/:entityId/interactions List
     * @apiGroup Interaction
     * @apiDescription List Interactions.
     *
     * @apiVersion 0.0.0
     * @apiIgnore Still under development.
     *
     * @apiHeader {String} Authorization TOKEN ID
     *
     * @apiParam {String} entityId Id of the Thing or Person taking part in the interaction.
     * @apiParam (Query) {String} [entity] Id of the second Thing or Person taking part in the interaction (Should return an list of one interaction).
     *
     * @apiSuccess {object} interactions The retrieved Interactions
     */
    this.router.get(
      "/:entity(things|persons)/:entityId/:component(interactions)",
      request => {
        this.introspectToken([request.params.entity]);
      },
      this.checkPolicy({ resource: "interactions", action: "list" }),
      (request, response, next) => {
        let entityDestId;
        if (request.query.entity !== undefined) {
          entityDestId = parseInt(request.query.entity);
        }
        this.model.interactions
          .list(request.user.sub, request.params.entityId, entityDestId)
          .then(result => this.success(response, { interactions: result }))
          .catch(error => next(error));
      }
    );

    /**
     * @api {get} /things|persons/:entityId/interactions/:interactionId Read
     * @apiGroup Interaction
     * @apiDescription Read an Interaction.
     *
     * @apiVersion 0.0.0
     * @apiIgnore Still under development.
     *
     * @apiHeader {String} Authorization TOKEN ID
     *
     * @apiParam {String} entityId      Id of the Thing or Person taking part in the interaction.
     * @apiParam {String} interactionId Id of the Interaction to read.
     *
     * @apiSuccess {object} thing The retrieved Thing
     */
    this.router.get(
      "/:entity(things|persons)/:entityId/:component(interactions)/:componentId",
      request => {
        this.introspectToken([request.params.entity]);
      },
      this.checkPolicy({ resource: "interactions", action: "read" }),
      (request, response, next) => {
        this.model.interactions
          .read(request.params.componentId)
          .then(result => this.success(response, { interaction: result }))
          .catch(error => next(error));
      }
    );
  }
}

module.exports = InteractionAPI;
