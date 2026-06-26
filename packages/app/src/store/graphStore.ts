import { create } from 'zustand';
import { api, ApiNode as GraphNode, ApiEdge as GraphEdge, type ApiProcessedSession } from '../api/client.js';

export type { GraphNode, GraphEdge };

interface GraphStore {
    nodes: GraphNode[];
    edges: GraphEdge[];
    processedSessions: Record<string, ApiProcessedSession>;
    selectedNodeId: string | null;
    searchQuery: string;
    isScanning: boolean;
    scanProgress: number;

    loadGraph: () => Promise<void>;
    selectNode: (id: string | null) => void;
    setSearchQuery: (q: string) => void;
    triggerScan: () => void;
}

export const useGraphStore = create<GraphStore>((set, get) => ({
    nodes: [],
    edges: [],
    processedSessions: {},
    selectedNodeId: null,
    searchQuery: '',
    isScanning: false,
    scanProgress: 0,

    loadGraph: async () => {
        const graph = await api.graph();
        set({
            nodes: Object.values(graph.nodes),
            edges: Object.values(graph.edges),
            processedSessions: graph.processedSessions ?? {},
        });
    },

    selectNode: (id) => set({ selectedNodeId: id }),

    setSearchQuery: (q) => set({ searchQuery: q }),

    triggerScan: () => {
        if (get().isScanning) return;
        set({ isScanning: true, scanProgress: 0 });

        api.scan().catch(() => {});

        const es = api.scanProgress();

        es.addEventListener('progress', (e) => {
            const pct = Number((e as MessageEvent).data);
            if (!Number.isNaN(pct)) set({ scanProgress: pct });
        });

        es.addEventListener('complete', () => {
            es.close();
            set({ isScanning: false, scanProgress: 100 });
            get().loadGraph();
        });

        es.addEventListener('error', () => {
            es.close();
            set({ isScanning: false });
        });
    },
}));
