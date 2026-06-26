import { memo } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { cn } from '../lib/utils.js';
import { Card, CardContent } from './ui/card.js';
import { Badge } from './ui/badge.js';

export type ConceptNodeData = {
    label: string;
    type: string;
    weight: number;
    highlighted: boolean;
    expanded: boolean;
    lod?: 0 | 1 | 2 | 3;
};

type ConceptNodeType = Node<ConceptNodeData, 'concept'>;

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

function toTitleCase(str: string): string {
    return str.replace(/\b\w/g, (c) => c.toUpperCase());
}

function ConceptNode({ data }: NodeProps<ConceptNodeType>) {
    const clamped = Math.min(Math.max(data.weight, 1), 20);
    const t = (clamped - 1) / 19;
    const width = 40 + t * 80;
    const fontSize = 9 + t * 4;
    const color = TYPE_COLORS[data.type] ?? '#64748b';

    const badgeSize = clamped >= 10 ? 'lg' : clamped >= 3 ? ('default' as const) : 'sm';
    const badgeVariant = clamped >= 5 ? ('default' as const) : 'outline';

    return (
        <>
            <Handle type="target" position={Position.Top} style={{ visibility: 'hidden' }} />
            <Card
                className={cn(
                    'animate-node-appear cursor-pointer transition-all duration-200',
                )}
                style={{
                    width,
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
                            className="min-w-0 flex-1 truncate font-medium leading-tight text-card-foreground"
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
                        <span className="truncate text-[9px] text-muted-foreground">
                            {data.type}
                        </span>
                    </div>
                </CardContent>
            </Card>
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
