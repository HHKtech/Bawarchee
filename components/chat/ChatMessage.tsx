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
            ? 'bg-amber-600 text-white'
            : 'border border-amber-200 bg-amber-50 text-amber-700'
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
              ? 'rounded-tr-none bg-gradient-to-br from-amber-500 to-orange-600 text-white'
              : 'rounded-tl-none border border-gray-100 bg-white text-gray-800'
          }`}
        >
          {message.content}
        </div>

        {/* Timestamp */}
        <span className="px-1 text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
          {timeString}
        </span>
      </div>
    </div>
  );
}
