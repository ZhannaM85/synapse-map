const BASE = '/api';

async function json<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${BASE}${path}`, init);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${path}`);
    return res.json() as Promise<T>;
}

export interface ApiNode {
    id: string;
    label: string;
    type: string;
    weight: number;
    firstSeen: string;
    lastSeen: string;
    conversationRefs?: string[];
}

export interface ApiProcessedSession {
    sessionId: string;
    cwd: string;
    processedAt: string;
    fileHash: string;
}

export interface ApiEdge {
    id: string;
    source: string;
    target: string;
    weight: number;
    type: string;
}

export interface ApiGraph {
    nodes: Record<string, ApiNode>;
    edges: Record<string, ApiEdge>;
    processedSessions?: Record<string, ApiProcessedSession>;
    updatedAt: string;
}

export interface ApiStatus {
    nodeCount: number;
    edgeCount: number;
    lastUpdated: string | null;
}

export const api = {
    graph: () => json<ApiGraph>('/graph?minEdgeWeight=2'),
    nodes: (type?: string) => json<ApiNode[]>(`/graph/nodes${type ? `?type=${type}` : ''}`),
    node: (id: string) => json<ApiNode>(`/graph/nodes/${id}`),
    edges: (minWeight?: number) => json<ApiEdge[]>(`/graph/edges${minWeight != null ? `?minWeight=${minWeight}` : ''}`),
    search: (q: string) => json<ApiNode[]>(`/search?q=${encodeURIComponent(q)}`),
    status: () => json<ApiStatus>('/status'),
    scan: () => json<{ message: string }>('/scan', { method: 'POST' }),
    scanProgress: () => new EventSource(`${BASE}/scan/progress`),
};
