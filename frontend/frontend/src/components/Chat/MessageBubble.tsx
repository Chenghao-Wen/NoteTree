import React from 'react';
import { ChatMessage } from '../../types/chat';
import { useTypewriter } from '../../hooks/useTypewriter';

interface Props {
  message: ChatMessage;
  onStreamComplete: () => void;
}

export const MessageBubble: React.FC<Props> = ({ message, onStreamComplete }) => {
  const isAi = message.role === 'ai';
  
  // 仅对正在 Streaming 的 AI 消息启用打字机 Hook
  const shouldAnimate = isAi && message.isStreaming;
  
  const displayText = useTypewriter(
    message.content, 
    20, // Speed: 20ms per char
    shouldAnimate, 
    onStreamComplete
  );

  // 如果不动画（或已完成），直接显示完整内容
  const content = shouldAnimate ? displayText : message.content;

  return (
    <div className={`flex ${isAi ? 'justify-start' : 'justify-end'}`}>
      <div 
        className={`max-w-[80%] rounded-2xl px-5 py-3.5 shadow-sm text-sm leading-relaxed ${
          isAi 
            ? 'bg-gray-100 text-gray-800 rounded-tl-none' 
            : 'bg-indigo-600 text-white rounded-tr-none'
        }`}
      >
        <div className="whitespace-pre-wrap">{content}</div>
        
        {/* Render Related Notes (Citations) if available and fully rendered */}
        {isAi && !shouldAnimate && message.relatedNotes && message.relatedNotes.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs font-semibold text-gray-500 mb-2">Sources:</p>
            <div className="flex flex-wrap gap-2">
              {message.relatedNotes.map((note) => (
                <span 
                  key={note.id} 
                  className="inline-flex items-center px-2 py-1 rounded bg-white border border-gray-200 text-xs text-indigo-600 cursor-pointer hover:border-indigo-300 transition-colors"
                >
                  📄 {note.title} <span className="text-gray-400 ml-1">({Math.round(note.score * 100)}%)</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};