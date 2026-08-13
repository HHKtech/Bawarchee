'use client';

import { useEffect, useRef, useState } from 'react';
import { useDashboard } from '@/context/DashboardContext';
import { ChatMessage } from '@/components/chat/ChatMessage';
import type { ChatMessage as ChatMessageType } from '@/lib/supabase/types';

export function ChatPanel() {
  const { activeSessionId, setGeneratedRecipes } = useDashboard();
  
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState('');
  const [exclusions, setExclusions] = useState<string[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  // Load chat history when session changes
  useEffect(() => {
    if (!activeSessionId) {
      setMessages([]);
      setExclusions([]);
      setError(null);
      return;
    }

    async function loadChatHistory(sessionId: string) {
      setIsLoadingHistory(true);
      setError(null);

      try {
        const response = await fetch(`/api/chat/messages?session_id=${encodeURIComponent(sessionId)}`);
        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.error ?? 'Failed to load chat history.');
        }

        const data = await response.json();
        setMessages(data.messages || []);
        setExclusions(data.exclusions || []);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoadingHistory(false);
      }
    }

    loadChatHistory(activeSessionId);
  }, [activeSessionId]);

  // Scroll on message updates
  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  // Send message handler
  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !activeSessionId || isSending) return;

    const userMessageContent = input.trim();
    setInput('');
    setIsSending(true);
    setError(null);

    // Optimistically add user message to chat feed
    const tempUserMessage: ChatMessageType = {
      id: `temp-user-${Date.now()}`,
      session_id: activeSessionId,
      user_id: '',
      role: 'user',
      content: userMessageContent,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMessage]);

    try {
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: activeSessionId, message: userMessageContent }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? 'Failed to send message.');
      }

      const data = await response.json();
      
      // Update messages with official assistant reply
      setMessages((prev) => {
        // Remove optimistic user message and insert final database messages
        const withoutTemp = prev.filter((m) => m.id !== tempUserMessage.id);
        
        // Let's reload user message and assistant reply from DB if returned
        // Or reconstruct it cleanly
        const finalUserMessage = {
          ...tempUserMessage,
          id: `db-user-${Date.now()}`,
        };
        return [...withoutTemp, finalUserMessage, data.message];
      });

      // Sync active exclusions list
      if (data.updatedExclusions) {
        setExclusions(data.updatedExclusions);
      }

      // Sync recipe panel if regeneration occurred
      if (data.updatedRecipes) {
        setGeneratedRecipes(data.updatedRecipes);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSending(false);
    }
  }

  // Render placeholder if no active session
  if (!activeSessionId) {
    return (
      <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex-shrink-0 border-b border-slate-100 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">Module 8</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900 font-sans">AI Chat</h2>
          <p className="mt-2 text-sm text-slate-600">
            A guided cooking assistant will use your selected pantry items and active recipe session here.
          </p>
        </div>

        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-4">
          <div className="flex min-h-full flex-col items-center justify-center rounded-3xl border border-dashed border-orange-200 bg-orange-50/60 p-8 text-center">
            <div className="text-4xl animate-pulse">💬</div>
            <h3 className="mt-4 text-lg font-bold text-slate-900">Chat is offline</h3>
            <p className="mt-2 max-w-sm text-sm text-slate-600">
              Please select pantry ingredients and click **Generate Recipes** to start a cooking session and unlock conversational refinements.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      {/* Panel Header */}
      <div className="flex-shrink-0 border-b border-slate-100 bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">Module 8</p>
            <h2 className="mt-0.5 text-xl font-bold text-slate-900 font-sans">Bawarchee Assistant</h2>
          </div>
          <div className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
        </div>

        {/* Exclusions Banner */}
        {exclusions.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5 rounded-2xl bg-rose-50/80 border border-rose-100/50 px-3 py-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Excluding:</span>
            {exclusions.map((item, idx) => (
              <span
                key={idx}
                className="rounded-lg bg-white border border-rose-200 px-2 py-0.5 text-xs font-semibold text-rose-800 lowercase shadow-sm"
              >
                {item}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Messages Feed */}
      <div className="custom-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto bg-slate-50/80 p-4">
        {isLoadingHistory ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-600 border-t-transparent" />
              <span className="text-xs font-bold text-gray-400">Loading chat history...</span>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center p-6 text-center text-gray-400">
            <div className="text-3xl">👋</div>
            <h4 className="mt-3 font-bold text-gray-950 text-sm">Ask Bawarchee anything!</h4>
            <p className="mt-1 text-xs max-w-[220px]">
              Ask about ingredients substitutions, step-by-step directions, or state ingredients you don&apos;t have.
            </p>
          </div>
        ) : (
          messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)
        )}

        {/* Typing indicator */}
        {isSending && (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-orange-200 bg-orange-50 text-orange-700 text-sm font-bold shadow-sm animate-bounce">
              👨‍🍳
            </div>
            <div className="rounded-2xl rounded-tl-none border border-gray-100 bg-white px-4 py-3 shadow-sm">
              <div className="flex items-center gap-1">
                <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-orange-600 [animation-delay:-0.3s]" />
                <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-orange-600 [animation-delay:-0.15s]" />
                <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-orange-600" />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-2xl bg-rose-50 border border-rose-100 p-4 text-xs font-semibold text-rose-700">
            ⚠ {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Message Form */}
      <form onSubmit={handleSendMessage} className="flex-shrink-0 border-t border-slate-100 bg-white p-4">
        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-1.5 transition focus-within:border-orange-500 focus-within:ring-4 focus-within:ring-orange-500/10">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isSending}
            placeholder="Ask about substitutions or state missing ingredients..."
            className="flex-1 bg-transparent py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400"
            id="chat-message-input"
          />
          <button
            type="submit"
            disabled={!input.trim() || isSending}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-600 text-white shadow-sm transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-slate-200"
            id="chat-send-btn"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 rotate-90"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </div>
      </form>
    </section>
  );
}
