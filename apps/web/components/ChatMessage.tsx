"use client";

import { User, Bot, Copy, Check } from "lucide-react";
import { useState } from "react";
import type { Message } from "@/lib/conversation.api";

interface ChatMessageProps {
  message: Message;
  index: number;
}

export function ChatMessage({ message, index }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Simple markdown-to-HTML renderer
  const renderMarkdown = (text: string) => {
    // Process markdown with basic rules
    let html = text
      // Code blocks (```...```)
      .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      // Bold
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      // Headers
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      // Unordered lists
      .replace(/^[*-] (.+)$/gm, '<li>$1</li>')
      // Ordered lists
      .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      // Blockquotes
      .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
      // Line breaks (double newline = paragraph)
      .replace(/\n\n/g, '</p><p>')
      // Single newlines within paragraphs
      .replace(/\n/g, '<br/>');

    // Wrap in paragraph if not already wrapped
    if (!html.startsWith('<')) {
      html = `<p>${html}</p>`;
    }

    // Wrap consecutive li elements in ul
    html = html.replace(/(<li>[\s\S]*?<\/li>)+/g, '<ul>$&</ul>');

    return html;
  };

  return (
    <div
      className={`flex gap-3 animate-fade-in-up ${isUser ? "justify-end" : "justify-start"
        }`}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Avatar — assistant only */}
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-linear-to-br from-[#6c63ff] to-[#22d3ee] flex items-center justify-center shrink-0 mt-1">
          <Bot className="w-4 h-4 text-white" />
        </div>
      )}

      <div className={`max-w-[75%] group relative ${isUser ? "chat-message-user" : "chat-message-assistant"}`}>
        <div className={`px-4 py-3 ${isUser ? "" : "markdown-content"}`}>
          {isUser ? (
            <p className="text-sm leading-relaxed">{message.content}</p>
          ) : (
            <div
              className="text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
            />
          )}
        </div>

        {/* Copy button for assistant messages */}
        {!isUser && (
          <button
            onClick={handleCopy}
            className="absolute -bottom-8 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1.5 text-[10px] text-[#8888a0] hover:text-white cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Avatar — user only */}
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-linear-to-br from-[#6c63ff] to-[#a78bfa] flex items-center justify-center shrink-0 mt-1">
          <User className="w-4 h-4 text-white" />
        </div>
      )}
    </div>
  );
}

/* ─── Typing Indicator Component ─────────────────────────────────── */
export function TypingIndicator({ stage }: { stage?: string }) {
  const stageLabels: Record<string, string> = {
    ANALYZING: "Analyzing request...",
    SCRAPING: "Scraping website...",
    AI_THINKING: "AI is thinking...",
    GENERATING: "Generating answer...",
    SYNCING: "Syncing...",
  };

  return (
    <div className="flex gap-3 justify-start animate-fade-in-up">
      <div className="w-8 h-8 rounded-full bg-linear-to-br from-[#6c63ff] to-[#22d3ee] flex items-center justify-center shrink-0 mt-1">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className="chat-message-assistant px-4 py-3">
        <div className="typing-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
        {stage && (
          <p className="text-xs text-[#8888a0] mt-1">
            {stageLabels[stage] || stage}
          </p>
        )}
      </div>
    </div>
  );
}
