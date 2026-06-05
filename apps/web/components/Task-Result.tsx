"use client";
import { useTask } from "@/hooks/useTask"

export function TaskResult({ taskId }: { taskId: string }) {
  const { liveUpdate, data: task, isLoading } = useTask(taskId);

  console.log({ liveUpdate, task });
  if (isLoading) return <p>Loading task...</p>;
  if (!task) return null;

  return (
    <div>
      <p>Status: {liveUpdate?.status}</p>

      {liveUpdate?.status === "PROCESSING" && <p>⏳ Working...</p>}

      {liveUpdate?.status === "FAILED" && (
        <p style={{ color: "red" }}>❌ {liveUpdate?.error}</p>
      )}

      {liveUpdate?.status === "COMPLETED" && <pre>{task.aiAnswer}</pre>}
    </div>
  );
}
