"use strict";

const API = require("./API");

/**
 * RoleAPI provides the routes for managing Roles of the DCD Hub.
 * A Role grant a set of Access Control Policies (ACP) to a entity subject
 * on an entity resource.
 */
class RoleAPI extends API {
  constructor(model) {
    super(model);
  }

  formatEntityId(request, response, next) {
    if (request.params.resourceEntityType === "things") {
      if (!request.params.resourceEntityId.startsWith("dcd:things:")) {
        request.params.resourceEntityId =
          "dcd:things:" + request.params.resourceEntityId;
      }
    }
    if (request.params.resourceEntityType === "persons") {
      if (!request.params.resourceEntityId.startsWith("dcd:persons:")) {
        request.params.resourceEntityId =
          "dcd:persons:" + request.params.resourceEntityId;
      }
    }
    next();
  }

  init() {
    /**
     * @api {post} "/:resourceEntityType(things|persons|)/:resourceEntityId/revoke/:roleName/:subjectEntityId" Grant
     * @apiGroup Role
     * @apiDescription Grant a Role to an Entity subject on a Entity resource.
     *
     * @apiVersion 0.1.0
     *
     * @apiHeader {string} Authorization TOKEN ID
     *
     * @apiParam {string} resourceEntityType 'things' or 'persons'
     * @apiParam {string} resourceEntityId Id of the entity to grant role from
     * @apiParam {string} :roleName Name of the role to grant
     * @apiParam {string} :subjectEntityId Id of the entity to grant role
     */
    this.router.post(
      "/:resourceEntityType(things|persons|)/:resourceEntityId/revoke/:roleName/:subjectEntityId",
      this.formatEntityId,
      this.introspectToken(["dcd:things", "dcd:roles"]),
      this.checkPolicy("things", "grant"),
      (request, response, next) => {
        this.model.policies
          .grant(
            request.params.subjectId,
            request.params.entityId,
            request.params.role
          )
          .then(result => this.success(response, result, 201))
          .catch(error => next(error));
      }
    );

    /**
     * @api {delete} "/:resourceEntityType(things|persons|)/:resourceEntityId/revoke/:roleName/:subjectEntityId" Revoke
     * @apiGroup Role
     * @apiDescription Revoke a Role from an Entity subject on a Entity resource.
     *
     * @apiVersion 0.1.0
     *
     * @apiHeader {string} Authorization TOKEN ID
     *
     * @apiParam {string} resourceEntityType 'things' or 'persons'
     * @apiParam {string} resourceEntityId Id of the entity to revoke role from
     * @apiParam {string} :roleName Name of the role to revoke
     * @apiParam {string} :subjectEntityId Id of the entity to revoke role
     */
    this.router.post(
      "/:resourceEntityType(things|persons|)/:resourceEntityId/revoke/:roleName/:subjectEntityId",
      this.formatEntityId,
      this.introspectToken(["dcd:things", "dcd:roles"]),
      this.checkPolicy("things", "revoke"),
      (request, response, next) => {
        this.model.policies
          .revoke(
            request.params.subjectEntityId,
            request.params.resourceEntityId,
            request.params.roleName
          )
          .then(result => this.success(response, result, 204))
          .catch(error => next(error));
      }
    );
  }
}

module.exports = RoleAPI;
