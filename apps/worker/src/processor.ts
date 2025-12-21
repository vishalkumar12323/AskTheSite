import { db } from "@db/index";
import { tasks } from "@db/db/schema";
import { eq } from "drizzle-orm";

export const processTaskJob = async (taskId: string) => {
  await db
    .update(tasks)
    .set({ status: "PROCESSING" })
    .where(eq(tasks.id, taskId));
};
