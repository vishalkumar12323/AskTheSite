"use client";

import { MessageSquarePlus, Globe, Clock } from "lucide-react";
import type { Conversation } from "@/lib/conversation.api";

interface ConversationSidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  isLoading?: boolean;
}

export function ConversationSidebar({
  conversations,
  activeId,
  onSelect,
  onNewChat,
  isLoading,
}: ConversationSidebarProps) {
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const extractDomain = (url: string) => {
    try {
      return new URL(url.startsWith("http") ? url : `https://${url}`).hostname;
    } catch {
      return url;
    }
  };

  return (
    <aside className="w-80 h-full flex flex-col border-r border-white/6 bg-[#0e0e18]">
      {/* Header */}
      <div className="p-5 border-b border-white/6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-[#6c63ff] to-[#22d3ee] flex items-center justify-center">
            <Globe className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-lg font-semibold gradient-text">AskTheSite</h1>
        </div>
        <button
          id="new-chat-button"
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-linear-to-r from-[#6c63ff] to-[#5a52e0] text-white text-sm font-medium hover:opacity-90 transition-all duration-200 hover:shadow-lg hover:shadow-[#6c63ff]/20 cursor-pointer"
        >
          <MessageSquarePlus className="w-4 h-4" />
          New Chat
        </button>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="space-y-2 p-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-white/3 animate-pulse" />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center px-4">
            <div className="w-12 h-12 rounded-full bg-white/4 flex items-center justify-center mb-3">
              <MessageSquarePlus className="w-5 h-5 text-[#8888a0]" />
            </div>
            <p className="text-sm text-[#8888a0]">No conversations yet</p>
            <p className="text-xs text-[#555570] mt-1">
              Start by asking about any website
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {conversations.map((conv, index) => (
              <button
                key={conv.id}
                id={`conversation-${conv.id}`}
                onClick={() => onSelect(conv.id)}
                className={`sidebar-item w-full text-left p-3 rounded-xl transition-all duration-200 cursor-pointer animate-slide-in-left ${activeId === conv.id
                    ? "active bg-[#6c63ff]/15 border-l-[3px] border-l-[#6c63ff]"
                    : "hover:bg-white/4"
                  }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${activeId === conv.id
                      ? "bg-[#6c63ff]/20"
                      : "bg-white/4"
                    }`}>
                    <Globe className={`w-3.5 h-3.5 ${activeId === conv.id ? "text-[#6c63ff]" : "text-[#8888a0]"
                      }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${activeId === conv.id ? "text-white" : "text-[#c8c8d8]"
                      }`}>
                      {conv.title || "Untitled"}
                    </p>
                    <p className="text-xs text-[#555570] truncate mt-0.5">
                      {extractDomain(conv.url)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-[#555570] flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {formatTime(conv.updatedAt)}
                      </span>
                      <span className="text-[10px] text-[#555570]">
                        · {conv.messageCount} msgs
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
