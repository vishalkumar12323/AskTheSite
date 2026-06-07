"use client";

import { Send, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

export function ChatInput({
  onSend,
  isLoading = false,
  placeholder = "Ask a follow-up question...",
  disabled = false,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
    }
  }, [message]);

  const handleSubmit = () => {
    const trimmed = message.trim();
    if (!trimmed || isLoading || disabled) return;
    onSend(trimmed);
    setMessage("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="glass rounded-2xl p-1.5 transition-all duration-200 focus-within:border-[#6c63ff]/30 focus-within:shadow-lg focus-within:shadow-[#6c63ff]/5">
      <div className="flex items-end gap-2">
        <textarea
          id="chat-input"
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="flex-1 bg-transparent text-sm text-[#e8e8ed] placeholder:text-[#555570] resize-none outline-none px-3 py-2.5 max-h-[120px]"
        />
        <button
          id="send-button"
          onClick={handleSubmit}
          disabled={!message.trim() || isLoading || disabled}
          className="p-2.5 rounded-xl bg-linear-to-r from-[#6c63ff] to-[#5a52e0] text-white disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition-all duration-200 hover:shadow-lg hover:shadow-[#6c63ff]/20 shrink-0 cursor-pointer"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}
