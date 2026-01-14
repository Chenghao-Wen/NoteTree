import React, { useEffect } from 'react';
import apiClient from '../lib/apiClient';
import { socketService } from '../lib/socket';
import { useTreeStore, NoteNode } from '../store/useTreeStore';
import { GraphView } from '../components/Graph/GraphView';
import { NoteDetailDrawer } from '../components/Drawer/NoteDetail'; // 假设已实现

export const DashboardPage: React.FC = () => {
  const setNodes = useTreeStore((state) => state.setNodes);
  const updateNodeStatus = useTreeStore((state) => state.updateNodeStatus);
  const isDrawerOpen = useTreeStore((state) => state.isDrawerOpen);

  // 1. Initial Data Fetch
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const { data } = await apiClient.get<NoteNode[]>('/notes');
        setNodes(data);
      } catch (error) {
        console.error('Failed to load notes', error);
      }
    };
    fetchNotes();
  }, [setNodes]);

  // 2. WebSocket Setup
  useEffect(() => {
    socketService.connect();

    // 监听：笔记状态变更 (Indexing -> Ready)
    const unsubscribeStatus = socketService.subscribe<{ noteId: string; status: any; aiCategory?: string }>(
      'note.status_changed',
      (payload) => {
        updateNodeStatus(payload.noteId, payload.status, payload.aiCategory);
      }
    );

    return () => {
      unsubscribeStatus?.();
      socketService.disconnect();
    };
  }, [updateNodeStatus]);

  return (
    <div className="flex h-full relative">
      <div className="flex-1 h-full">
        {/* Graph Visualization */}
        <GraphView />
        
        {/* Floating Action Button for Upload (Mock) */}
        <button 
          className="absolute bottom-8 right-8 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition-transform hover:scale-105"
          onClick={() => console.log('Open Upload Modal')}
        >
          <span className="text-2xl">+</span>
        </button>
      </div>

      {/* Detail Drawer (Right Side) */}
      {isDrawerOpen && (
        <div className="absolute right-0 top-0 h-full w-96 bg-white shadow-2xl border-l border-gray-200 z-20">
           {/* Component Implementation Omitted for Brevity - Standard UI */}
           <div className="p-4">
              <h2 className="text-xl font-bold">Note Details</h2>
              <p className="text-gray-500 mt-2">Content goes here...</p>
           </div>
        </div>
      )}
    </div>
  );
};