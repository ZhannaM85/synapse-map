import { create } from 'zustand';
import { api, ApiNode as GraphNode, ApiEdge as GraphEdge, type ApiProcessedSession } from '../api/client.js';

export type { GraphNode, GraphEdge };

interface GraphStore {
    nodes: GraphNode[];
    edges: GraphEdge[];
    processedSessions: Record<string, ApiProcessedSession>;
    selectedNodeId: string | null;
    focusNodeId: string | null;
    searchQuery: string;
    isScanning: boolean;
    scanProgress: number;
    expandedNodeId: string | null;
    previousLevelIds: Set<string>;

    loadGraph: () => Promise<void>;
    selectNode: (id: string | null) => void;
    focusNode: (id: string) => void;
    clearFocusNode: () => void;
    setSearchQuery: (q: string) => void;
    triggerScan: () => void;
    setViewState: (expandedNodeId: string | null, previousLevelIds: Set<string>) => void;
}

export const useGraphStore = create<GraphStore>((set, get) => ({
    nodes: [],
    edges: [],
    processedSessions: {},
    selectedNodeId: null,
    focusNodeId: null,
    searchQuery: '',
    isScanning: false,
    scanProgress: 0,
    expandedNodeId: null,
    previousLevelIds: new Set<string>(),

    loadGraph: async () => {
        const graph = await api.graph();
        set({
            nodes: Object.values(graph.nodes),
            edges: Object.values(graph.edges),
            processedSessions: graph.processedSessions ?? {},
        });
    },

    selectNode: (id) => set({ selectedNodeId: id }),
    focusNode: (id) => set({ selectedNodeId: id, focusNodeId: id }),
    clearFocusNode: () => set({ focusNodeId: null }),
    setViewState: (expandedNodeId, previousLevelIds) => set({ expandedNodeId, previousLevelIds }),

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
