import { Router } from "express";
import { createTask, getTaskById } from "../controllers/task.controller.js";

const router = Router();

router.post("/", createTask);

router.get("/:id", getTaskById);

export default router;
