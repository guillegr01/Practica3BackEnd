import type { Collection } from "mongodb";
import type { Task, TaskModel } from "./types.ts";

export const fromModelToTask = (TaskDB: TaskModel, taskCollection: Collection<TaskModel>) :  Task => {

    return {
        id: TaskDB._id!.toString(),
        title: TaskDB.title,
        completed: TaskDB.completed,
    }

} 