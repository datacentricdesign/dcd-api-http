"use strict";

const API = require("./API");
const Task = require("@datacentricdesign/model/entities/Task");

class TaskAPI extends API {
    constructor(model, auth) {
      super(model, auth);
    }
  
    init() {
    
    /**
     * @api {post} /tasks Create
     * @apiGroup Task
     * @apiDescription Create a Task.
     *
     * @apiParam (Body) {Task} task Task to create as JSON.
     * @apiParamExample {json} task:
     *     {
     *       "name": "My Task",
     *       "description": "A description of my task.",
     *       "types": ["LOCATION","ACCELEROMETTER"],
     *       "from" : 1483228800000,
     *       "to" : 1566286292578,
     *       "actor_entity_id" : "your_person_id"
     *     }
     *
     * @apiHeader {String} Content-type application/json
     * @apiHeader {String} Authorization TOKEN ID
     *
     * @apiSuccess {object} thing The created Thing
     */
    this.router.post(
        "/",
        this.auth.introspect,
        //this.auth.wardenSubject({ resource: "task", action: "create" }), //Not sure it will works
        (request, response) => {
          
          const actorId = request.user.sub;

          if(request.body === undefined ||
              actorId != request.body.actor_entity_id){
            this.fail(
                new Error("Missing body with actor_entity_id" +
                " or mismatch with request user sub")
              );
            }else {
            const task = new Task(request.body);

            this.model.task
             .create(/*actorId,*/ task)
             .then(result => this.success(response, { task: result }))
             .catch(error => this.fail(response, error));
            }
        }
      );

    /**
     * @api {get} /tasks List
     * @apiGroup Task
     * @apiDescription List Tasks.
     *
     * @apiHeader {String} Authorization TOKEN ID
     *
     * @apiSuccess {object} tasks The retrieved Tasks (actor and subject)
     */
    this.router.get(
        "/",
        this.auth.introspect,
        //this.auth.wardenSubject({ resource: "tasks", action: "list" }),
        (request, response) => {
          this.model.tasks
            .list(request.user.sub)
            .then(result => this.success(response, { tasks: result }))
            .catch(error => this.fail(response, error));
        }
      );
    
    /**
     * @api {get} /tasks/taskId Read
     * @apiGroup Task
     * @apiDescription Read a Task.
     *
     * @apiHeader {String} Authorization TOKEN ID
     *
     * @apiParam {String} taskId Id of the Task to read.
     *
     * @apiSuccess {object} task The retrieved Task
     */
    this.router.get(
        "/:taskId",
        this.auth.introspect,
        //this.auth.wardenSubject({ resource: "tasks", action: "read" }),
        (request, response) => {
          this.model.tasks
            .read(request.params.taskId)
            .then(result => {
              this.success(response, { task: result });
            })
            .catch(error => this.fail(response, error));
        }
      );


    /**
     * @api {delete} /tasks/taskId Delete
     * @apiGroup Task
     * @apiDescription Delete a Task.
     *
     * @apiHeader {String} Authorization TOKEN ID
     *
     * @apiParam {String} taskId Id of the Task to delete.
     */
    this.router.delete(
        "/:taskId",
        this.auth.introspect,
        //this.auth.wardenSubject({ resource: "tasks", action: "delete" }),
        (request, response) => {
          this.model.tasks
            .del(request.params.taskId)
            .then(result => this.success(response, result))
            .catch(error => this.fail(response, error));
        }
      );

    /**
     * @api {get} /tasks/taskId/resources Read
     * @apiGroup Task
     * @apiDescription Read the task resource(s).
     *
     * @apiHeader {String} Authorization TOKEN ID
     *
     * @apiParam {String} taskId Id of the Task to read.
     * @apiParam (Query) {Boolean} [actor=true] retrieve all the resources of the tasks that your are actor
     *
     * @apiSuccess {object} task The retrieved Task
     */
    this.router.get(
        "/:taskId/resources",
        this.auth.introspect,
        //this.auth.wardenSubject({ resource: "resources", action: "read" }),
        (request, response) => {

         const taskId = request.params.taskId;
         const personId = request.user.sub;
         const actor =
          request.query.actor !== undefined
            ? request.query.actor === "true"
            : false;

          this.model.tasks
            .readResources(taskId,personId,actor)
            .then(result => {
              this.success(response, { resources: result });
            })
            .catch(error => this.fail(response, error));
        }
      );




    }
  }
  
  module.exports = TaskAPI;