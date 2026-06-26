import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ReactFlow,
    ReactFlowProvider,
    Background,
    Controls,
    MiniMap,
    useReactFlow,
    useViewport,
    type Node,
    type Edge,
    type NodeMouseHandler,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
    forceSimulation,
    forceLink,
    forceManyBody,
    forceCenter,
    forceCollide,
    type SimulationNodeDatum,
    type SimulationLinkDatum,
} from 'd3-force';

import { useGraphStore, type GraphNode, type GraphEdge } from '../store/graphStore.js';
import ConceptNode, { type ConceptNodeData } from './ConceptNode.js';

// Higher zoom = fewer, more important nodes (like Google Maps: zoom in = your city, zoom out = whole world)
const LOD_LEVELS = [
    { maxZoom: 0.4, nodeWeight: 5,  edgeWeight: 1 }, // LOD 0 — far out → ~641 nodes as dots
    { maxZoom: 0.8, nodeWeight: 15, edgeWeight: 2 }, // LOD 1 — overview → ~135 nodes
    { maxZoom: 1.3, nodeWeight: 40, edgeWeight: 5 }, // LOD 2 — detail → ~65 nodes
    { maxZoom: Infinity, nodeWeight: 90, edgeWeight: 10 }, // LOD 3 — close-up → ~10 hubs
] as const;

const nodeTypes = { concept: ConceptNode };

interface ForceNode extends SimulationNodeDatum {
    id: string;
}

const LAYOUT_WIDTH = 900;
const LAYOUT_HEIGHT = 650;

function computeLayout(
    graphNodes: GraphNode[],
    graphEdges: GraphEdge[],
): Map<string, { x: number; y: number }> {
    const positions = new Map<string, { x: number; y: number }>();
    if (graphNodes.length === 0) return positions;

    const simNodes: ForceNode[] = graphNodes.map((n) => ({ id: n.id }));
    const nodeIndex = new Map(simNodes.map((n, i) => [n.id, i]));

    const simLinks: SimulationLinkDatum<ForceNode>[] = graphEdges
        .filter((e) => nodeIndex.has(e.source) && nodeIndex.has(e.target))
        .map((e) => ({ source: e.source, target: e.target }));

    const sim = forceSimulation(simNodes)
        .force(
            'link',
            forceLink<ForceNode, SimulationLinkDatum<ForceNode>>(simLinks).id((d) => d.id).distance(80),
        )
        .force('charge', forceManyBody().strength(-150))
        .force('center', forceCenter(0, 0))
        .force('collide', forceCollide(30))
        .stop();

    for (let i = 0; i < 300; i++) sim.tick();

    // Normalize all positions to fit within LAYOUT_WIDTH × LAYOUT_HEIGHT
    const xs = simNodes.map((n) => n.x ?? 0);
    const ys = simNodes.map((n) => n.y ?? 0);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const spanX = maxX - minX || 1;
    const spanY = maxY - minY || 1;
    const scale = Math.min(LAYOUT_WIDTH / spanX, LAYOUT_HEIGHT / spanY);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    for (const node of simNodes) {
        positions.set(node.id, {
            x: ((node.x ?? 0) - cx) * scale,
            y: ((node.y ?? 0) - cy) * scale,
        });
    }

    return positions;
}

function GraphCanvasInner() {
    const { nodes: storeNodes, edges: storeEdges, loadGraph, selectNode, selectedNodeId } =
        useGraphStore();
    const { fitView } = useReactFlow();
    const { zoom } = useViewport();

    const lod = (zoom < 0.4 ? 0 : zoom < 0.7 ? 1 : zoom < 1.2 ? 2 : 3) as 0 | 1 | 2 | 3;
    const { nodeWeight: nodeWeightThreshold, edgeWeight: edgeWeightThreshold } = LOD_LEVELS[lod];

    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
    const [layoutPositions, setLayoutPositions] = useState<Map<string, { x: number; y: number }>>(new Map());
    const hasInitialFit = useRef(false);

    useEffect(() => {
        loadGraph();
    }, [loadGraph]);

    const baseNodeIds = useMemo(
        () => new Set(storeNodes.filter((n) => n.weight >= nodeWeightThreshold).map((n) => n.id)),
        [storeNodes, nodeWeightThreshold],
    );

    const visibleNodeIds = useMemo(() => {
        const ids = new Set(baseNodeIds);
        for (const id of expandedIds) {
            // Show the top 15 neighbors that aren't already visible at the current LOD
            storeEdges
                .filter((e) => {
                    if (e.source !== id && e.target !== id) return false;
                    const nbr = e.source === id ? e.target : e.source;
                    return !baseNodeIds.has(nbr);
                })
                .sort((a, b) => b.weight - a.weight)
                .slice(0, 15)
                .forEach((e) => ids.add(e.source === id ? e.target : e.source));
        }
        return ids;
    }, [baseNodeIds, expandedIds, storeEdges]);

    const visibleNodes = useMemo(
        () => storeNodes.filter((n) => visibleNodeIds.has(n.id)),
        [storeNodes, visibleNodeIds],
    );

    const visibleEdges = useMemo(
        () =>
            storeEdges.filter(
                (e) =>
                    e.weight >= edgeWeightThreshold &&
                    visibleNodeIds.has(e.source) &&
                    visibleNodeIds.has(e.target),
            ),
        [storeEdges, visibleNodeIds, edgeWeightThreshold],
    );

    const connectedToHovered = useMemo(() => {
        if (!hoveredNodeId) return new Set<string>();
        const ids = new Set<string>();
        ids.add(hoveredNodeId);
        for (const e of visibleEdges) {
            if (e.source === hoveredNodeId) ids.add(e.target);
            if (e.target === hoveredNodeId) ids.add(e.source);
        }
        return ids;
    }, [hoveredNodeId, visibleEdges]);

    const connectedEdgeIds = useMemo(() => {
        if (!hoveredNodeId) return new Set<string>();
        const ids = new Set<string>();
        for (const e of visibleEdges) {
            if (e.source === hoveredNodeId || e.target === hoveredNodeId) {
                ids.add(e.id);
            }
        }
        return ids;
    }, [hoveredNodeId, visibleEdges]);

    useEffect(() => {
        if (visibleNodes.length === 0) return;
        const positions = computeLayout(visibleNodes, visibleEdges);
        setLayoutPositions(new Map(positions));
    }, [visibleNodes, visibleEdges]);

    // fitView exactly once — when the first layout positions arrive
    useEffect(() => {
        if (layoutPositions.size === 0 || hasInitialFit.current) return;
        hasInitialFit.current = true;
        setTimeout(() => fitView({ padding: 0.15, duration: 400 }), 50);
    }, [layoutPositions]); // eslint-disable-line react-hooks/exhaustive-deps

    const nodeById = useMemo(
        () => new Map(storeNodes.map((n) => [n.id, n])),
        [storeNodes],
    );

    const flowNodes: Node<ConceptNodeData>[] = useMemo(
        () =>
            visibleNodes.map((n) => {
                const pos = layoutPositions.get(n.id) ?? { x: 0, y: 0 };
                const highlighted =
                    hoveredNodeId !== null
                        ? connectedToHovered.has(n.id)
                        : n.id === selectedNodeId;

                const connections = storeEdges
                    .filter((e) => e.source === n.id || e.target === n.id)
                    .sort((a, b) => b.weight - a.weight)
                    .slice(0, 10)
                    .map((e) => {
                        const nbrId = e.source === n.id ? e.target : e.source;
                        const nbr = nodeById.get(nbrId);
                        return {
                            id: nbrId,
                            label: nbr?.label ?? nbrId,
                            edgeWeight: e.weight,
                            nodeWeight: nbr?.weight ?? 0,
                            inView: visibleNodeIds.has(nbrId),
                        };
                    });

                return {
                    id: n.id,
                    type: 'concept' as const,
                    position: pos,
                    data: {
                        label: n.label,
                        type: n.type,
                        weight: n.weight,
                        highlighted,
                        expanded: expandedIds.has(n.id),
                        lod,
                        connections,
                    },
                };
            }),
        [visibleNodes, layoutPositions, hoveredNodeId, connectedToHovered, selectedNodeId, expandedIds, lod, storeEdges, nodeById, visibleNodeIds],
    );

    const maxWeight = useMemo(
        () => Math.max(1, ...visibleEdges.map((e) => e.weight)),
        [visibleEdges],
    );

    const flowEdges: Edge[] = useMemo(
        () =>
            visibleEdges.map((e) => {
                const thickness = 1 + (e.weight / maxWeight) * 5;
                const isHighlighted = connectedEdgeIds.has(e.id);
                return {
                    id: e.id,
                    source: e.source,
                    target: e.target,
                    style: {
                        strokeWidth: thickness,
                        stroke: isHighlighted ? '#6366f1' : '#94a3b8',
                        opacity: hoveredNodeId !== null ? (isHighlighted ? 1 : 0.2) : 0.6,
                        transition: 'opacity 0.2s, stroke 0.2s',
                    },
                    animated: isHighlighted,
                };
            }),
        [visibleEdges, maxWeight, connectedEdgeIds, hoveredNodeId],
    );


    const onNodeClick: NodeMouseHandler = useCallback(
        (_event, node) => {
            selectNode(node.id);
            setExpandedIds((prev) => {
                const next = new Set(prev);
                if (next.has(node.id)) {
                    next.delete(node.id);
                } else {
                    next.add(node.id);
                }
                return next;
            });
        },
        [selectNode],
    );

    const onNodeMouseEnter: NodeMouseHandler = useCallback((_event, node) => {
        setHoveredNodeId(node.id);
    }, []);

    const onNodeMouseLeave: NodeMouseHandler = useCallback(() => {
        setHoveredNodeId(null);
    }, []);

    const onPaneClick = useCallback(() => {
        selectNode(null);
        setExpandedIds(new Set());
    }, [selectNode]);

    return (
        <ReactFlow
            nodes={flowNodes}
            edges={flowEdges}
            nodeTypes={nodeTypes}
            onNodeClick={onNodeClick}
            onNodeMouseEnter={onNodeMouseEnter}
            onNodeMouseLeave={onNodeMouseLeave}
            onPaneClick={onPaneClick}
            defaultViewport={{ x: 0, y: 0, zoom: 1.5 }}
            minZoom={0.05}
            maxZoom={4}
            proOptions={{ hideAttribution: true }}
            className="bg-background"
        >
            <Background gap={20} size={1} color="#334155" />
            <Controls showInteractive={false} />
            <MiniMap
                pannable
                zoomable
                nodeColor="#6366f1"
                maskColor="rgba(0, 0, 0, 0.7)"
            />
        </ReactFlow>
    );
}

export default function GraphCanvas() {
    return (
        <div className="h-full w-full">
            <ReactFlowProvider>
                <GraphCanvasInner />
            </ReactFlowProvider>
        </div>
    );
}
