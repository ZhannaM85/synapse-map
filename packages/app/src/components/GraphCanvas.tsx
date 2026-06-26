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

const LOD_LEVELS = [
    { maxZoom: 0.4, nodeWeight: 80, edgeWeight: 20 }, // LOD 0 — Hubs (~18 nodes, ~39 edges)
    { maxZoom: 0.7, nodeWeight: 40, edgeWeight: 10 }, // LOD 1 — Overview (~65 nodes, ~215 edges)
    { maxZoom: 1.2, nodeWeight: 15, edgeWeight: 5  }, // LOD 2 — Detail (~135 nodes, ~863 edges)
    { maxZoom: Infinity, nodeWeight: 5, edgeWeight: 2 }, // LOD 3 — Deep (~641 nodes)
] as const;

const nodeTypes = { concept: ConceptNode };

interface ForceNode extends SimulationNodeDatum {
    id: string;
}

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
            forceLink<ForceNode, SimulationLinkDatum<ForceNode>>(simLinks).id((d) => d.id).distance(120),
        )
        .force('charge', forceManyBody().strength(-300))
        .force('center', forceCenter(0, 0))
        .force('collide', forceCollide(40))
        .stop();

    for (let i = 0; i < 300; i++) sim.tick();

    for (const node of simNodes) {
        positions.set(node.id, { x: node.x ?? 0, y: node.y ?? 0 });
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
    const prevLodRef = useRef<number | null>(null);

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
            for (const edge of storeEdges) {
                if (edge.source === id) ids.add(edge.target);
                if (edge.target === id) ids.add(edge.source);
            }
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

    // fitView once per LOD level, after layout positions are ready
    useEffect(() => {
        if (layoutPositions.size === 0) return;
        if (prevLodRef.current === lod) return;
        prevLodRef.current = lod;
        setTimeout(() => fitView({ padding: 0.2, duration: 600 }), 50);
    }, [layoutPositions, lod, fitView]);

    const flowNodes: Node<ConceptNodeData>[] = useMemo(
        () =>
            visibleNodes.map((n) => {
                const pos = layoutPositions.get(n.id) ?? { x: 0, y: 0 };
                const highlighted =
                    hoveredNodeId !== null
                        ? connectedToHovered.has(n.id)
                        : n.id === selectedNodeId;
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
                    },
                };
            }),
        [visibleNodes, layoutPositions, hoveredNodeId, connectedToHovered, selectedNodeId, expandedIds, lod],
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
            defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
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
