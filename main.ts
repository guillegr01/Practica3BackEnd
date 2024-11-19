//Practica 3 ARQUITECTURA Y PROGRAMACIÓN DE SISTEMAS EN INTERNET

import { MongoClient, ObjectId } from "mongodb"
import { TaskModel } from "./types.ts";
import { fromModelToTask } from "./utils.ts";

const MONGO_URL = Deno.env.get("MONGO_URL");

if(!MONGO_URL) {
  console.error("MONGO_URL Not found");
  Deno.exit(1);
}

const client = new MongoClient(MONGO_URL);
await client.connect();
console.info("MONGO_DB server connected succesfully");

const db = client.db("Tasks_DB");
const TaskCollection = db.collection<TaskModel>("tasks");

const handler = async (req: Request) : Promise <Response>  => {

  const method = req.method;
  const url = new URL(req.url);

  const path = url.pathname;
  
  if (method==="GET") {
      
    //1. Obtener todas las tareas
    if (path=="/tasks"){
      
      const tasksDB = await TaskCollection.find().toArray();
      if(!tasksDB)return new Response("No tasks on the DDBB", {status:404});
      const tasks = await Promise.all(tasksDB.map((tm:TaskModel) => fromModelToTask(tm, TaskCollection)));

      return new Response(JSON.stringify(tasks));
    
    //2. Obtener una tarea por ID  
    }else if(path.startsWith("/tasks/")){
      
      const splittedID = path.split("/",3);
      const id = splittedID[2];

      if(!id) return new Response("Bad Request,ID is needed", {status:400});

      const taskDB_ByID = await TaskCollection.findOne({_id: new ObjectId(id)});
      if(!taskDB_ByID)return new Response("No task on DDBB with the specified ID", {status:404});
      
      const task_ById = await fromModelToTask(taskDB_ByID, TaskCollection);

      return new Response(JSON.stringify(task_ById));

    }
  
  //3. Crear una nueva tarea
  }else if (method==="POST") {
    
    if (path==="/tasks") {
      
      const newTask = await req.json();

      if(!newTask.title) return new Response("Bad Request. Tittle it's needed", {status:400});

      const taskExist = await TaskCollection.findOne({title: newTask.title});

      if(taskExist)return new Response("Task already exists on DDBB", {status:400});

      const { insertedId } = await TaskCollection.insertOne({
        title: newTask.title,
        completed: false,
      });

      return new Response(JSON.stringify({
        id: insertedId,
        title: newTask.title,
        completed: false,
      }), {status:201});

    }

  //4. Actualizar el estado de una tarea
  }else if (method==="PUT") {
    if (path.startsWith("/tasks/")){
      
      const splittedID = path.split("/",3);
      const id = splittedID[2];

      if(!id) return new Response("Bad Request,ID is needed", {status:400});

      const taskToUpdate = await req.json();
      
      //usamos el metodo keys ya que completed es un campo boolean y con !taskToUpdate.completed no funcionaria
      if(!Object.keys(taskToUpdate).includes("completed")) return new Response("Bad Request, completed state is required", {status:400});

      const { modifiedCount } = await TaskCollection.updateOne(
        {_id: new ObjectId(id)},
        {$set : {completed: taskToUpdate.completed}}
      );

      if (modifiedCount === 0) {
        return new Response("Task not found", { status: 404 });
      }

      return new Response(JSON.stringify({
        id: id,
        title: taskToUpdate.title,
        completed: taskToUpdate.completed,
      }), {status:201});

    }

  //5. Eliminar una tarea
  }else if (method==="DELETE") {

    if (path.startsWith("/tasks/")){
      
      const splittedIDforDelete = path.split("/",3);
      const idForDelete = splittedIDforDelete[2];

      if(!idForDelete) return new Response("Bad Request,ID is needed", {status:400});

      const { deletedCount } = await TaskCollection.deleteOne({
        _id: new ObjectId(idForDelete),
      })

      if (deletedCount===0)return new Response("Task not found to delete", {status:404});

      return new Response(`User with id ${idForDelete} succesfully deleted`, {status:200});

    }
    
  }

  return new Response("Endpoint not found", {status:404});
  
}

Deno.serve({port:3000}, handler);