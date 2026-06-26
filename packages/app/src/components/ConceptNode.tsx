import { memo } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';

export type ConceptNodeData = {
    label: string;
    type: string;
    weight: number;
    highlighted: boolean;
    expanded: boolean;
};

type ConceptNodeType = Node<ConceptNodeData, 'concept'>;

const TYPE_COLORS: Record<string, string> = {
    concept: '#6366f1',
    function: '#8b5cf6',
    class: '#a855f7',
    module: '#3b82f6',
    file: '#06b6d4',
    variable: '#14b8a6',
    type: '#f59e0b',
    interface: '#f97316',
};

function ConceptNode({ data }: NodeProps<ConceptNodeType>) {
    const size = 28 + Math.min(data.weight, 10) * 4;
    const color = TYPE_COLORS[data.type] ?? '#64748b';
    const borderWidth = data.highlighted ? 3 : 1.5;
    const opacity = data.highlighted ? 1 : 0.85;

    return (
        <>
            <Handle type="target" position={Position.Top} style={{ visibility: 'hidden' }} />
            <div
                className="flex items-center justify-center rounded-full transition-all duration-200"
                style={{
                    width: size,
                    height: size,
                    backgroundColor: `${color}20`,
                    border: `${borderWidth}px solid ${color}`,
                    opacity,
                    boxShadow: data.highlighted ? `0 0 12px ${color}60` : 'none',
                }}
            >
                <span
                    className="max-w-[80px] truncate text-center text-[10px] font-medium leading-tight"
                    style={{ color }}
                >
                    {data.label}
                </span>
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
