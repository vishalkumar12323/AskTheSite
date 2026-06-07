// ─── Shared task types ────────────────────────────────────────────

/** All possible task lifecycle statuses. */
export type TaskStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

/** The nested question record embedded inside a Task API response. */
export interface TaskQuestion {
  id: string;
  url: string;
  question: string;
  createdAt: string;
}

/** The nested answer record embedded inside a Task API response. */
export interface TaskAnswer {
  id: string;
  aiAnswer: string | null;
  errMessage: string | null;
  websiteUrl: string | null;
  websiteLogo: string | null;
  websiteSignupUrl: string | null;
  taskId: string;
  createdAt: string | null;
  updatedAt: string | null;
}

/**
 * Full Task shape as returned by GET /tasks/:id.
 * Matches the `getTaskService` Drizzle query with `with: { question, answer }`.
 */
export interface Task {
  id: string;
  status: TaskStatus;
  createdAt: string;
  question: TaskQuestion;
  answer: TaskAnswer | null;
}

/** Payload sent to POST /tasks. */
export interface CreateTaskPayload {
  url: string;
  question: string;
}

// ─── WebSocket event type ────────────────────────────────────────
// Shape of the `task:update` event emitted by the API's WebSocket server.

export interface TaskUpdate {
  status: TaskStatus;
  stage?: string;
  progress?: number;
  error?: string;
  taskId?: string;
  conversationId?: string | null;
  answer?: string;
}
