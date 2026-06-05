import { api } from "./api";

export interface Conversation {
  id: string;
  url: string;
  title: string | null;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface ConversationDetail {
  id: string;
  url: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
  tasks: { id: string; status: string }[];
}

export const createConversation = async (payload: {
  url: string;
  question: string;
}): Promise<{ conversationId: string; taskId: string }> => {
  const { data } = await api.post("/conversations", payload);
  return data;
};

export const listConversations = async (): Promise<Conversation[]> => {
  const { data } = await api.get("/conversations");
  return data;
};

export const getConversation = async (
  id: string
): Promise<ConversationDetail> => {
  const { data } = await api.get(`/conversations/${id}`);
  return data;
};

export const sendFollowUp = async (
  conversationId: string,
  question: string
): Promise<{ taskId: string; messageId: string }> => {
  const { data } = await api.post(`/conversations/${conversationId}/messages`, {
    question,
  });
  return data;
};
