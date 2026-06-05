"use client";

import { useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { ConversationSidebar } from "@/components/ConversationSidebar";
import { ChatView } from "@/components/ChatView";
import { NewConversationDialog } from "@/components/NewConversationDialog";

import { useConversations } from "@/hooks/useConversations";
import { useConversation } from "@/hooks/useConversation";
import { useCreateConversation } from "@/hooks/useCreateConversation";
import { useSendFollowUp } from "@/hooks/useSendFollowUp";
import { useConversationSocket } from "@/hooks/useConversationSocket";

export default function Home() {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [showNewChat, setShowNewChat] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState<string | undefined>();

  const queryClient = useQueryClient();

  // Data hooks
  const { data: conversations = [], isLoading: loadingConversations } = useConversations();
  const { data: activeConversation } = useConversation(activeConversationId);
  const createConversation = useCreateConversation();
  const sendFollowUp = useSendFollowUp(activeConversationId);

  // WebSocket for real-time updates
  const { update, subscribeTask, clearUpdate } = useConversationSocket(activeConversationId);

  // Handle real-time updates
  useEffect(() => {
    if (!update) return;

    if (update.status === "PROCESSING") {
      setIsProcessing(true);
      setProcessingStage(update.stage);
    }

    if (update.status === "COMPLETED" || update.status === "FAILED") {
      setIsProcessing(false);
      setProcessingStage(undefined);

      // Refresh conversation data to show the new assistant message
      if (activeConversationId) {
        queryClient.invalidateQueries({
          queryKey: ["conversation", activeConversationId],
        });
      }
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      clearUpdate();
    }
  }, [update, activeConversationId, queryClient, clearUpdate]);

  // Select a conversation
  const handleSelectConversation = useCallback((id: string) => {
    setActiveConversationId(id);
    setShowNewChat(false);
    setIsProcessing(false);
    setProcessingStage(undefined);
    clearUpdate();
  }, [clearUpdate]);

  // New chat
  const handleNewChat = useCallback(() => {
    setActiveConversationId(null);
    setShowNewChat(true);
    setIsProcessing(false);
    setProcessingStage(undefined);
  }, []);

  // Create conversation
  const handleCreateConversation = useCallback(
    (url: string, question: string) => {
      createConversation.mutate(
        { url, question },
        {
          onSuccess: (data) => {
            setActiveConversationId(data.conversationId);
            setShowNewChat(false);
            setIsProcessing(true);
            setProcessingStage("ANALYZING");
            // Subscribe to task updates
            subscribeTask(data.taskId);
          },
        }
      );
    },
    [createConversation, subscribeTask]
  );

  // Send follow-up
  const handleSendFollowUp = useCallback(
    (question: string) => {
      sendFollowUp.mutate(question, {
        onSuccess: (data) => {
          setIsProcessing(true);
          setProcessingStage("ANALYZING");
          // Subscribe to this specific task
          subscribeTask(data.taskId);
        },
      });
    },
    [sendFollowUp, subscribeTask]
  );

  return (
    <main className="w-full h-screen flex overflow-hidden bg-[#0a0a0f]">
      {/* Sidebar */}
      <ConversationSidebar
        conversations={conversations}
        activeId={activeConversationId}
        onSelect={handleSelectConversation}
        onNewChat={handleNewChat}
        isLoading={loadingConversations}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {showNewChat || !activeConversation ? (
          <NewConversationDialog
            onSubmit={handleCreateConversation}
            isLoading={createConversation.isPending}
          />
        ) : (
          <ChatView
            conversation={activeConversation}
            onSendFollowUp={handleSendFollowUp}
            isProcessing={isProcessing}
            processingStage={processingStage}
            isSending={sendFollowUp.isPending}
          />
        )}
      </div>
    </main>
  );
}
