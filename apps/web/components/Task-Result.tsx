"use client";

import { useTask } from "@/hooks/useTask";

export function TaskResult({ taskId }: { taskId: string }) {
  const { data, isLoading } = useTask(taskId);

  if (isLoading) return <p>Loading task...</p>;
  if (!data) return null;

  return (
    <div>
      <p>Status: {data.status}</p>

      {data.status === "PROCESSING" && <p>⏳ Working...</p>}

      {data.status === "FAILED" && (
        <p style={{ color: "red" }}>❌ {data.errorMessage}</p>
      )}

      {data.status === "COMPLETED" && <pre>{data.aiAnswer}</pre>}
    </div>
  );
}
