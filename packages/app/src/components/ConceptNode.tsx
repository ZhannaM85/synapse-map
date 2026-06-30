import { memo } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { cn } from '../lib/utils.js';
import { Card, CardContent } from './ui/card.js';
import { Badge } from './ui/badge.js';

export type NodeConnection = {
    id: string;
    label: string;
    edgeWeight: number;
    nodeWeight: number;
    inView: boolean;
};

export type ConceptNodeData = {
    label: string;
    type: string;
    weight: number;
    highlighted: boolean;
    expanded: boolean;
    lod?: 0 | 1 | 2 | 3;
    connections?: NodeConnection[];
};

type ConceptNodeType = Node<ConceptNodeData, 'concept'>;

type RenderMode = 'dot' | 'compact' | 'card';

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

export function getRenderMode(lod: 0 | 1 | 2 | 3 | undefined, weight: number): RenderMode {
    const l = lod ?? 3;
    return l === 0 ? 'dot'
        : l === 1 ? (weight >= 60 ? 'compact' : 'dot')
        : l === 2 ? (weight >= 40 ? 'card' : 'compact')
        : 'card';
}

export const NODE_DIMENSIONS: Record<RenderMode, { width: number; height: number } | undefined> = {
    dot: { width: 24, height: 24 },
    compact: { width: 90, height: 44 },
    card: undefined,
};

function toTitleCase(str: string): string {
    return str.replace(/\b\w/g, (c) => c.toUpperCase());
}

function ConceptNode({ data }: NodeProps<ConceptNodeType>) {
    const clamped = Math.min(Math.max(data.weight, 1), 20);
    const t = (clamped - 1) / 19;
    const color = TYPE_COLORS[data.type] ?? '#64748b';
    const renderMode = getRenderMode(data.lod, data.weight);
    const dotSize = Math.round(8 + t * 14);

    if (renderMode === 'dot') {
        return (
            <>
                <Handle type="target" position={Position.Top} style={{ visibility: 'hidden' }} />
                <div
                    style={{
                        width: dotSize,
                        height: dotSize,
                        borderRadius: '50%',
                        backgroundColor: color,
                        opacity: data.highlighted ? 1 : 0.7,
                        boxShadow: data.highlighted ? `0 0 0 3px ${color}30` : undefined,
                    }}
                />
                <Handle type="source" position={Position.Bottom} style={{ visibility: 'hidden' }} />
            </>
        );
    }

    if (renderMode === 'compact') {
        return (
            <>
                <Handle type="target" position={Position.Top} style={{ visibility: 'hidden' }} />
                <div className="flex flex-col items-center gap-0.5">
                    <div
                        style={{
                            width: dotSize,
                            height: dotSize,
                            borderRadius: '50%',
                            backgroundColor: color,
                            opacity: data.highlighted ? 1 : 0.7,
                            boxShadow: data.highlighted ? `0 0 0 3px ${color}30` : undefined,
                        }}
                    />
                    <span className="max-w-[80px] overflow-hidden text-ellipsis whitespace-nowrap text-[9px] leading-tight text-foreground">
                        {toTitleCase(data.label)}
                    </span>
                </div>
                <Handle type="source" position={Position.Bottom} style={{ visibility: 'hidden' }} />
            </>
        );
    }

    // card mode — full rendering
    const fontSize = 9 + t * 4;
    const badgeSize = clamped >= 10 ? 'lg' : clamped >= 3 ? ('default' as const) : 'sm';
    const badgeVariant = clamped >= 5 ? ('default' as const) : 'outline';

    const hiddenConns = data.connections?.filter((c) => !c.inView) ?? [];
    const totalConns = data.connections?.length ?? 0;

    return (
        <>
            <Handle type="target" position={Position.Top} style={{ visibility: 'hidden' }} />
            <div className="group relative">
                <Card
                    className={cn(
                        'animate-node-appear cursor-pointer transition-all duration-200',
                    )}
                    style={{
                        borderColor: data.highlighted ? color : `${color}60`,
                        borderWidth: data.highlighted ? 2 : 1,
                        boxShadow: data.highlighted
                            ? `0 0 0 3px ${color}30, 0 0 16px ${color}20`
                            : undefined,
                    }}
                >
                    <CardContent className="space-y-1 p-1.5">
                        <div className="flex items-center justify-between gap-1">
                            <span
                                className="whitespace-nowrap font-medium leading-tight text-card-foreground"
                                style={{ fontSize }}
                            >
                                {toTitleCase(data.label)}
                            </span>
                            <Badge size={badgeSize} variant={badgeVariant}>
                                {data.weight}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                            <div
                                className="h-1.5 w-1.5 shrink-0 rounded-full"
                                style={{ backgroundColor: color }}
                            />
                            <span className="whitespace-nowrap text-[9px] text-muted-foreground">
                                {data.type}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* Debug tooltip */}
                <div className="pointer-events-none absolute left-full top-0 z-50 ml-2 hidden w-60 rounded-md border border-border bg-card p-2 text-xs shadow-xl group-hover:block">
                        <div className="mb-1.5 font-semibold text-foreground">
                            Top {totalConns} connections ({hiddenConns.length} hidden)
                        </div>
                        {data.connections!.map((c) => (
                            <div key={c.id} className="flex items-center justify-between gap-1 py-0.5">
                                <span className={cn('truncate', c.inView ? 'text-foreground' : 'text-muted-foreground')}>
                                    {c.inView ? '✓ ' : '○ '}{c.label}
                                </span>
                                <span className="shrink-0 tabular-nums text-muted-foreground">
                                    e:{c.edgeWeight} n:{c.nodeWeight}
                                </span>
                            </div>
                        ))}
                        {totalConns === 0 && (
                            <div className="text-muted-foreground">No connections in store</div>
                        )}
                    </div>
            </div>

            {data.expanded && (
                <div
                    className="absolute -bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full"
                    style={{ backgroundColor: color }}
                />
            )}
            <Handle type="source" position={Position.Bottom} style={{ visibility: 'hidden' }} />
        </>
    );
}

export default memo(ConceptNode);
