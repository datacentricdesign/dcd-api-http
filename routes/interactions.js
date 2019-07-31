"use strict";

const API = require("./API");
const Interaction = require("dcd-model/entities/Interaction");

class InteractionAPI extends API {
  constructor(model, auth) {
    super(model, auth);
  }

  init() {
    /**
     * @api {post} /things|persons/:entityId/interactions Create
     * @apiGroup Interaction
     * @apiDescription Create an Interaction.
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
      this.auth.introspect,
      this.auth.wardenSubject({ resource: "interactions", action: "create" }),
      (request, response) => {
        if (
          request.body === undefined ||
          (request.body.entity_id_1 !== request.params.entityId &&
            request.body.entity_id_2 !== request.params.entityId)
        ) {
          return API.fail(
            new Error(
              "Missing body with entityId1 and entityId2," +
                " or mismatch with requester thing id."
            )
          );
        }
        const interaction = new Interaction(request.body);
        this.model.interactions
          .create(interaction)
          .then(result => API.success(response, { interaction: result }))
          .catch(error => API.fail(response, error));
      }
    );

    /**
     * @api {get} /things|persons/:entityId/interactions List
     * @apiGroup Interaction
     * @apiDescription List Interactions.
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
      this.auth.introspect,
      this.auth.wardenSubject({ resource: "interactions", action: "list" }),
      (request, response) => {
        let entityDestId;
        if (request.query.entity !== undefined) {
          entityDestId = parseInt(request.query.entity);
        }
        this.model.interactions
          .list(request.user.sub, request.params.entityId, entityDestId)
          .then(result => API.success(response, { interactions: result }))
          .catch(error => API.fail(response, error));
      }
    );

    /**
     * @api {get} /things|persons/:entityId/interactions/:interactionId Read
     * @apiGroup Interaction
     * @apiDescription Read an Interaction.
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
      this.auth.introspect,
      this.auth.wardenSubject({ resource: "interactions", action: "read" }),
      (request, response) => {
        this.model.interactions
          .read(request.params.componentId)
          .then(result => API.success(response, { interaction: result }))
          .catch(error => API.fail(response, error));
      }
    );
  }
}

module.exports = InteractionAPI;
