export interface RelatedNote {
  id: string;
  title: string;
  score: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  relatedNotes?: RelatedNote[]; // AI 回复可能包含引用来源
  timestamp: number;
  isStreaming?: boolean; // 标记是否正在进行打字机动画
}

export type ChatStatus = 'IDLE' | 'SENDING' | 'PROCESSING' | 'STREAMING';