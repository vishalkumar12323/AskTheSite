// ─── Shared task types ────────────────────────────────────────────
// These types mirror the actual database schema and API response shapes.
// Import from here in all hooks and components — do NOT redefine locally.

/** All possible task lifecycle statuses (matches DB enum). */
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
  /** The original question linked to this task. */
  question: TaskQuestion;
  /** The AI answer record — null until the worker marks it COMPLETED/FAILED. */
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
  /** AI answer text — present only when status === "COMPLETED". */
  answer?: string;
}
