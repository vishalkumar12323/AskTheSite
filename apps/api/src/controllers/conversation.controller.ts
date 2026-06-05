import { Request, Response, NextFunction } from "express";
import {
  createConversationService,
  listConversationsService,
  getConversationService,
  addFollowUpService,
} from "../services/conversation.services.js";

export const createConversation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { url, question } = req.body;
    if (!url || !question) {
      return res.status(400).json({ error: "url and question are required" });
    }
    const result = await createConversationService(url, question);
    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const listConversations = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const conversations = await listConversationsService();
    return res.status(200).json(conversations);
  } catch (error) {
    next(error);
  }
};

export const getConversation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const conversation = await getConversationService(req.params.id);
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }
    return res.status(200).json(conversation);
  } catch (error) {
    next(error);
  }
};

export const addFollowUp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ error: "question is required" });
    }
    const result = await addFollowUpService(req.params.id, question);
    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};
