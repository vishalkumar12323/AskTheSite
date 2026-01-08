import { Request, Response, NextFunction } from "express";
import {
  createTaskService,
  getTaskService,
} from "../services/task.services.js";

export const createTask = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { url, question } = req.body;

    const taskId = await createTaskService(url, question);
    return res.status(201).json({ taskId });
  } catch (error) {
    next(error);
  }
};
export const getTaskById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const task = await getTaskService(req.params.id);
    return res.status(200).json(task);
  } catch (error) {
    next(error);
  }
};
