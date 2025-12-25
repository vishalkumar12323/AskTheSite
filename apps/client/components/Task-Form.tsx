"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

import { useCreateTask } from "@/hooks/useCreateTask";

export const TaskForm = ({
  onCreated,
}: {
  onCreated: (taskId: string) => void;
}) => {
  const [url, setUrl] = useState("");
  const [question, setQuestion] = useState("");

  const { mutate, isPending } = useCreateTask();

  const submit = () => {
    mutate(
      { url, question },
      {
        onSuccess(data) {
          onCreated(data.taskId);
        },
      }
    );
  };
  return (
    <>
      <Input
        placeholder="www.example.com"
        onChange={(e) => setUrl(e.target.value)}
      />
      <Textarea
        placeholder="Ask about website..."
        onChange={(e) => setQuestion(e.target.value)}
      />
      <Button variant={"default"} onClick={submit} disabled={isPending}>
        {isPending ? "Submitting..." : "Submit"}
      </Button>
    </>
  );
};
