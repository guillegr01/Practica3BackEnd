import { type OptionalId } from "mongodb";

export type TaskModel = OptionalId<{
    title: string,
    completed: boolean
}>

export type Task = {
    id: string,
    title: string,
    completed: boolean
};