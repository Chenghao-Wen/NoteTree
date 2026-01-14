import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import apiClient from '../../lib/apiClient';
import { socketService } from '../../lib/socket';
import { ChatMessage, ChatStatus, RelatedNote } from '../../types/chat';
import { MessageBubble } from './MessageBubble'; // 下文实现

// API Response Types
interface SearchResponse {
  jobId: string;
}

interface WSSearchResult {
  jobId: string;
  summary: string;
  relatedNotes: RelatedNote[];
}

export const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [status, setStatus] = useState<ChatStatus>('IDLE');
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  
  // 滚动到底部的 Ref
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages, status]);

  // WebSocket Listener
  useEffect(() => {
    // 监听后端通过 WS 推送的异步搜索结果
    const unsubscribe = socketService.subscribe<WSSearchResult>('search.result', (payload) => {
      if (payload.jobId === currentJobId) {
        handleSearchResult(payload);
      }
    });
    return unsubscribe;
  }, [currentJobId]);

  const handleSearchResult = (result: WSSearchResult) => {
    setStatus('STREAMING');
    
    // 添加一条 AI 消息，内容由 MessageBubble 内部的 Typewriter Hook 渲染
    const aiMsg: ChatMessage = {
      id: uuidv4(),
      role: 'ai',
      content: result.summary, // 完整内容传给子组件
      relatedNotes: result.relatedNotes,
      timestamp: Date.now(),
      isStreaming: true, // 标记开始流式播放
    };
    
    setMessages((prev) => [...prev, aiMsg]);
  };

  const handleSend = async () => {
    if (!inputValue.trim() || status !== 'IDLE') return;

    const userMsg: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content: inputValue,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setStatus('SENDING');

    try {
      // 1. POST 请求触发任务
      const { data } = await apiClient.post<SearchResponse>('/search', { 
        query: userMsg.content 
      });
      
      // 2. 记录 JobId，进入等待状态
      setCurrentJobId(data.jobId);
      setStatus('PROCESSING');
    } catch (error) {
      console.error('Search failed', error);
      setStatus('IDLE');
      // 实际项目中应添加一条系统错误消息
      setMessages(prev => [...prev, {
        id: uuidv4(),
        role: 'ai',
        content: 'Sorry, something went wrong. Please try again.',
        timestamp: Date.now()
      }]);
    }
  };

  // 处理流式播放结束
  const handleStreamComplete = (msgId: string) => {
    setMessages((prev) => 
      prev.map(m => m.id === msgId ? { ...m, isStreaming: false } : m)
    );
    setStatus('IDLE');
    setCurrentJobId(null);
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto bg-white shadow-sm border-x border-gray-100">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg) => (
          <MessageBubble 
            key={msg.id} 
            message={msg} 
            onStreamComplete={() => handleStreamComplete(msg.id)}
          />
        ))}
        
        {/* Loading Indicator */}
        {(status === 'SENDING' || status === 'PROCESSING') && (
          <div className="flex items-center gap-2 text-gray-400 text-sm animate-pulse ml-2">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            <span>Thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-100 bg-gray-50">
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-sm"
            placeholder="Ask anything about your notes..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={status !== 'IDLE'}
          />
          <button
            onClick={handleSend}
            disabled={status !== 'IDLE' || !inputValue.trim()}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};