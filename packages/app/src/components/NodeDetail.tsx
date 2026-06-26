import { useMemo } from 'react';
import { cn } from '../lib/utils.js';
import { useGraphStore, type GraphNode } from '../store/graphStore.js';
import { Badge } from './ui/badge.js';

const TYPE_COLORS: Record<string, string> = {
    concept: '#6366f1',
    project: '#10b981',
    function: '#8b5cf6',
    class: '#a855f7',
    module: '#3b82f6',
    file: '#06b6d4',
    variable: '#14b8a6',
    type: '#f59e0b',
    interface: '#f97316',
};

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

export default function NodeDetail() {
    const { nodes, edges, selectedNodeId, selectNode, processedSessions } = useGraphStore();

    const selectedNode = useMemo(
        () => nodes.find((n) => n.id === selectedNodeId) ?? null,
        [nodes, selectedNodeId],
    );

    const relatedNodes = useMemo(() => {
        if (!selectedNodeId) return [];
        return edges
            .filter((e) => e.source === selectedNodeId || e.target === selectedNodeId)
            .sort((a, b) => b.weight - a.weight)
            .map((e) => {
                const neighborId = e.source === selectedNodeId ? e.target : e.source;
                const neighbor = nodes.find((n) => n.id === neighborId);
                return neighbor ? { node: neighbor, edgeWeight: e.weight } : null;
            })
            .filter((r): r is { node: GraphNode; edgeWeight: number } => r !== null);
    }, [selectedNodeId, edges, nodes]);

    const conversationRefs = useMemo(() => {
        if (!selectedNode?.conversationRefs) return [];
        return selectedNode.conversationRefs
            .map((sessionId) => {
                const session = processedSessions[sessionId];
                return session
                    ? { sessionId, cwd: session.cwd, date: session.processedAt }
                    : { sessionId, cwd: '', date: '' };
            })
            .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    }, [selectedNode, processedSessions]);

    const color = selectedNode ? (TYPE_COLORS[selectedNode.type] ?? '#64748b') : '#64748b';

    return (
        <aside
            className={cn(
                'h-full shrink-0 overflow-hidden border-border bg-background transition-all duration-300',
                selectedNode ? 'w-80 border-l' : 'w-0',
            )}
        >
            <div className="flex h-full w-80 flex-col">
                {selectedNode && (
                    <>
                        <div className="flex items-start justify-between gap-2 border-b border-border p-4">
                            <div className="min-w-0 flex-1">
                                <h2 className="truncate text-lg font-semibold text-foreground">
                                    {selectedNode.label}
                                </h2>
                                <div className="mt-1 flex items-center gap-1.5">
                                    <div
                                        className="h-2 w-2 shrink-0 rounded-full"
                                        style={{ backgroundColor: color }}
                                    />
                                    <span className="text-sm text-muted-foreground">
                                        {selectedNode.type}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => selectNode(null)}
                                className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                aria-label="Close"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex-1 space-y-5 overflow-y-auto p-4">
                            <div>
                                <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                    Weight
                                </h3>
                                <div className="mt-1 flex items-center gap-2">
                                    <Badge variant="default" size="lg">
                                        {selectedNode.weight}
                                    </Badge>
                                    <span className="text-sm text-muted-foreground">
                                        conversations
                                    </span>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                    Timeline
                                </h3>
                                <dl className="mt-1 space-y-1 text-sm">
                                    <div className="flex justify-between">
                                        <dt className="text-muted-foreground">First seen</dt>
                                        <dd className="text-foreground">
                                            {formatDate(selectedNode.firstSeen)}
                                        </dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-muted-foreground">Last seen</dt>
                                        <dd className="text-foreground">
                                            {formatDate(selectedNode.lastSeen)}
                                        </dd>
                                    </div>
                                </dl>
                            </div>

                            {relatedNodes.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                        Related nodes
                                    </h3>
                                    <ul className="mt-1 space-y-0.5">
                                        {relatedNodes.map(({ node, edgeWeight }) => (
                                            <li key={node.id}>
                                                <button
                                                    onClick={() => selectNode(node.id)}
                                                    className="flex w-full items-center justify-between rounded px-2 py-1.5 text-sm transition-colors hover:bg-muted"
                                                >
                                                    <div className="flex min-w-0 items-center gap-1.5">
                                                        <div
                                                            className="h-1.5 w-1.5 shrink-0 rounded-full"
                                                            style={{
                                                                backgroundColor:
                                                                    TYPE_COLORS[node.type] ??
                                                                    '#64748b',
                                                            }}
                                                        />
                                                        <span className="truncate text-foreground">
                                                            {node.label}
                                                        </span>
                                                    </div>
                                                    <Badge variant="outline" size="sm">
                                                        {edgeWeight}
                                                    </Badge>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {conversationRefs.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                        Conversations
                                    </h3>
                                    <ul className="mt-1 space-y-1.5">
                                        {conversationRefs.map(({ sessionId, cwd, date }) => (
                                            <li
                                                key={sessionId}
                                                className="rounded border border-border px-2 py-1.5 text-xs"
                                            >
                                                <div className="truncate font-mono text-foreground">
                                                    {sessionId}
                                                </div>
                                                {cwd && (
                                                    <div className="mt-0.5 truncate text-muted-foreground">
                                                        {cwd}
                                                    </div>
                                                )}
                                                {date && (
                                                    <div className="mt-0.5 text-muted-foreground">
                                                        {formatDate(date)}
                                                    </div>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </aside>
    );
}
