import { create } from 'zustand';

export interface NoteNode {
  id: string;
  title: string;
  category?: string;
  status: 'PENDING' | 'READY' | 'FAILED';
  parentId?: string;
  // D3 simulation props
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface TreeState {
  nodes: NoteNode[];
  selectedNodeId: string | null;
  isDrawerOpen: boolean;
  
  setNodes: (nodes: NoteNode[]) => void;
  addNode: (node: NoteNode) => void;
  updateNodeStatus: (id: string, status: NoteNode['status'], category?: string) => void;
  selectNode: (id: string | null) => void;
  closeDrawer: () => void;
}

export const useTreeStore = create<TreeState>((set) => ({
  nodes: [],
  selectedNodeId: null,
  isDrawerOpen: false,

  setNodes: (nodes) => set({ nodes }),
  
  addNode: (node) => set((state) => ({ 
    nodes: [...state.nodes, node] 
  })),

  updateNodeStatus: (id, status, category) => set((state) => ({
    nodes: state.nodes.map((n) => 
      n.id === id ? { ...n, status, category: category || n.category } : n
    )
  })),

  selectNode: (id) => set({ 
    selectedNodeId: id, 
    isDrawerOpen: !!id 
  }),

  closeDrawer: () => set({ 
    isDrawerOpen: false, 
    selectedNodeId: null 
  }),
}));