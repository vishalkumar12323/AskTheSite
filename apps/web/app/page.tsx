"use client";
import { TaskForm } from "@/components/Task-Form";
import { TaskResult } from "@/components/Task-Result";
import { useState } from "react";

export default function Home() {
  const [taskId, setTaskId] = useState<string | null>();
  return (
    <main className="w-full h-screen flex justify-center items-center">
      <div className=" w-full mx-auto max-w-1/2 shadow-lg rounded-md p-4 border bg-gray-50 flex flex-col gap-3">
        <TaskForm onCreated={setTaskId} />

        {taskId && <TaskResult taskId={taskId} />}
      </div>
    </main>
  );
}
