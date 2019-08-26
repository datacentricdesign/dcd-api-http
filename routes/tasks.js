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
     *       "types": ["LOCATION","ACCELEROMETER"],
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
              response,
                new Error("Missing body with actor_entity_id" +
                " or mismatch with request user sub")
              );
            }else {
            const task = new Task(request.body);

            this.model.task
             .create(task)
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
            .del(request.params.taskId,request.user.sub)
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


    /**
     * @api {post} /tasks/:taskId/resources/:resourceId/milestones Add milestones
     * @apiGroup Task
     * @apiDescription Add milestones to a resource of a task.
     *
     * @apiParam (Body) {json} json Json with status and shared_properties.
     * @apiParamExample {json} milestone:
     *     {
     *       "shared_properties": ["shared-property-id-1","shared-property-id-2"],
     *       "status": "read" // There are 4 status "unread","read","accepted","refused"
     *     }
     *
     * @apiHeader {String} Content-type application/json
     * @apiHeader {String} Authorization TOKEN ID
     *
     * @apiSuccess {boolean} true
     */
    this.router.post(
      "/:taskId/resources/:resourceId/milestones",
      this.auth.introspect,
      //this.auth.wardenSubject({ resource: "task", action: "create" }), //Not sure it will works
      (request, response) => {
        
        const subjectId = request.user.sub;

         if(request.body === undefined ||
          request.body.shared_properties === undefined ||
          request.body.status === undefined
          ){
        this.fail(response,
            new Error("Missing body" +
            " or missing body.shared_properties"+
            " or missing body.status")
          );
        }else {

          let shared_properties

          if(Array.isArray(request.body.shared_properties)){
            shared_properties = request.body.shared_properties.join()
          }else{
            shared_properties = request.body.shared_properties
          }

          const milestone = {
            resource_id : request.params.resourceId,
            timestamp : Date.now(),
            shared_properties : shared_properties,
            status : request.body.status
          }

        this.model.tasks
         .addMilestone(milestone,subjectId)
         .then(() => this.success(response, { success: true }))
         .catch(error => this.fail(response, error));
        }
      }
    );
    }
  }
  
  module.exports = TaskAPI;