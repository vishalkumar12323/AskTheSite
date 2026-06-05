import { Router } from "express";
import {
  createConversation,
  listConversations,
  getConversation,
  addFollowUp,
} from "../controllers/conversation.controller.js";

const router = Router();

router.post("/", createConversation);
router.get("/", listConversations);
router.get("/:id", getConversation);
router.post("/:id/messages", addFollowUp);

export default router;
