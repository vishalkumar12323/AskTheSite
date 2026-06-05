"use client";

import { useRef, useEffect } from "react";
import { Globe, ExternalLink } from "lucide-react";
import { ChatMessage, TypingIndicator } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import type { ConversationDetail } from "@/lib/conversation.api";

interface ChatViewProps {
  conversation: ConversationDetail;
  onSendFollowUp: (question: string) => void;
  isProcessing?: boolean;
  processingStage?: string;
  isSending?: boolean;
}

export function ChatView({
  conversation,
  onSendFollowUp,
  isProcessing = false,
  processingStage,
  isSending = false,
}: ChatViewProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation.messages, isProcessing]);

  const extractDomain = (url: string) => {
    try {
      return new URL(url.startsWith("http") ? url : `https://${url}`).hostname;
    } catch {
      return url;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <header className="px-6 py-4 border-b border-white/[0.06] glass">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6c63ff]/20 to-[#22d3ee]/20 flex items-center justify-center">
              <Globe className="w-4 h-4 text-[#6c63ff]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white truncate max-w-md">
                {conversation.title || "Untitled Conversation"}
              </h2>
              <p className="text-xs text-[#8888a0] flex items-center gap-1">
                {extractDomain(conversation.url)}
                <a
                  href={conversation.url.startsWith("http") ? conversation.url : `https://${conversation.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#6c63ff] transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#555570] bg-white/[0.04] px-2.5 py-1 rounded-full">
              {conversation.messages.length} messages
            </span>
          </div>
        </div>
        {/* Progress bar when processing */}
        {isProcessing && (
          <div className="mt-3 w-full overflow-hidden rounded-full">
            <div className="progress-bar" />
          </div>
        )}
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {conversation.messages.map((msg, i) => (
            <ChatMessage key={msg.id} message={msg} index={i} />
          ))}

          {/* Show typing indicator when processing */}
          {isProcessing && <TypingIndicator stage={processingStage} />}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-white/[0.06]">
        <div className="max-w-3xl mx-auto">
          <ChatInput
            onSend={onSendFollowUp}
            isLoading={isSending}
            disabled={isProcessing}
            placeholder={
              isProcessing
                ? "Waiting for response..."
                : "Ask a follow-up question..."
            }
          />
          <p className="text-[10px] text-[#555570] text-center mt-2">
            Press Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
