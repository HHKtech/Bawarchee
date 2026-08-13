'use client';

import type { ChatMessage as ChatMessageType } from '@/lib/supabase/types';

type ChatMessageProps = {
  message: ChatMessageType;
};

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  
  // Format timestamp (e.g., "10:45 AM")
  const timeString = new Date(message.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`flex w-full gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar Icon */}
      <div
        className={`flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-xl text-sm font-bold shadow-sm transition duration-300 ${
          isUser
            ? 'bg-orange-600 text-white'
            : 'border border-orange-200 bg-orange-50 text-orange-700'
        }`}
      >
        {isUser ? '👤' : '👨‍🍳'}
      </div>

      {/* Bubble container */}
      <div className={`flex max-w-[75%] flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Message bubble */}
        <div
          className={`rounded-2xl px-4 py-3 text-sm font-medium leading-relaxed shadow-sm transition-all duration-300 ${
            isUser
              ? 'rounded-br-sm bg-orange-600 text-white shadow-sm'
              : 'rounded-bl-sm border border-slate-200/60 bg-slate-100 text-slate-800'
          }`}
        >
          {message.content}
        </div>

        {/* Timestamp */}
        <span className="px-1 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
          {timeString}
        </span>
      </div>
    </div>
  );
}
