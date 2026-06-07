"use client";

import { useState } from "react";
import { Globe, MessageSquarePlus, Loader2, ArrowRight } from "lucide-react";

interface NewConversationDialogProps {
  onSubmit: (url: string, question: string) => void;
  isLoading?: boolean;
}

export function NewConversationDialog({
  onSubmit,
  isLoading = false,
}: NewConversationDialogProps) {
  const [url, setUrl] = useState("");
  const [question, setQuestion] = useState("");
  const [step, setStep] = useState<"url" | "question">("url");

  const handleSubmit = () => {
    if (!url.trim() || !question.trim()) return;
    onSubmit(url.trim(), question.trim());
  };

  const handleUrlNext = () => {
    if (!url.trim()) return;
    setStep("question");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (step === "url") {
        handleUrlNext();
      } else {
        handleSubmit();
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full px-6">
      <div className="max-w-lg w-full animate-fade-in-up">

        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-[#6c63ff] to-[#22d3ee] flex items-center justify-center mx-auto mb-5 shadow-lg shadow-[#6c63ff]/20">
            <Globe className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold gradient-text mb-2">
            AskTheSite
          </h1>
          <p className="text-[#8888a0] text-sm">
            Ask any question about any website. Get AI-powered answers instantly.
          </p>
        </div>


        <div className="glass rounded-2xl p-6 space-y-5">

          <div className="space-y-2">
            <label htmlFor="url-input" className="text-xs font-medium text-[#8888a0] uppercase tracking-wider">
              Website URL
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555570]" />
              <input
                id="url-input"
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="https://example.com"
                disabled={isLoading}
                autoFocus
                className="w-full bg-white/4 border border-white/8 rounded-xl pl-10 pr-4 py-3 text-sm text-[#e8e8ed] placeholder:text-[#555570] outline-none focus:border-[#6c63ff]/50 focus:ring-1 focus:ring-[#6c63ff]/20 transition-all duration-200"
              />
            </div>
          </div>

          {/* Question Input — revealed after URL */}
          <div
            className={`space-y-2 transition-all duration-300 ${step === "url"
                ? "opacity-40 pointer-events-none"
                : "opacity-100"
              }`}
          >
            <label htmlFor="question-input" className="text-xs font-medium text-[#8888a0] uppercase tracking-wider">
              Your Question
            </label>
            <textarea
              id="question-input"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What does this website do? What are its pricing plans?"
              disabled={isLoading || step === "url"}
              rows={3}
              className="w-full bg-white/4 border border-white/8 rounded-xl px-4 py-3 text-sm text-[#e8e8ed] placeholder:text-[#555570] outline-none resize-none focus:border-[#6c63ff]/50 focus:ring-1 focus:ring-[#6c63ff]/20 transition-all duration-200"
            />
          </div>

          {/* Action Button */}
          {step === "url" ? (
            <button
              id="next-step-button"
              onClick={handleUrlNext}
              disabled={!url.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-linear-to-r from-[#6c63ff] to-[#5a52e0] text-white text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition-all duration-200 hover:shadow-lg hover:shadow-[#6c63ff]/20 cursor-pointer"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              id="submit-button"
              onClick={handleSubmit}
              disabled={!url.trim() || !question.trim() || isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-linear-to-r from-[#6c63ff] to-[#5a52e0] text-white text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition-all duration-200 hover:shadow-lg hover:shadow-[#6c63ff]/20 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating conversation...
                </>
              ) : (
                <>
                  <MessageSquarePlus className="w-4 h-4" />
                  Start Conversation
                </>
              )}
            </button>
          )}
        </div>

        {/* Hint */}
        <p className="text-center text-[10px] text-[#555570] mt-4">
          Your conversation will be saved so you can ask follow-up questions
        </p>
      </div>
    </div>
  );
}
