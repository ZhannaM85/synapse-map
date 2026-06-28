import { useCallback, useEffect, useRef, useState } from 'react';
import { Command, CommandInput, CommandItem, CommandList, CommandEmpty, CommandGroup } from './ui/command.js';
import { Badge } from './ui/badge.js';
import { api, type ApiNode } from '../api/client.js';
import { useGraphStore } from '../store/graphStore.js';

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

export default function SearchBar() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<ApiNode[]>([]);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
    const focusNode = useGraphStore((s) => s.focusNode);

    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((prev) => !prev);
            }
            if (e.key === 'Escape' && open) {
                setOpen(false);
            }
        }
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [open]);

    const search = useCallback((value: string) => {
        setQuery(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!value.trim()) {
            setResults([]);
            return;
        }
        debounceRef.current = setTimeout(async () => {
            try {
                const data = await api.search(value);
                setResults(data);
            } catch {
                setResults([]);
            }
        }, 200);
    }, []);

    const selectResult = useCallback(
        (nodeId: string) => {
            focusNode(nodeId);
            setOpen(false);
            setQuery('');
            setResults([]);
        },
        [focusNode],
    );

    if (!open) {
        return (
            <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground shadow transition-colors hover:text-foreground"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                </svg>
                Search nodes…
                <kbd className="pointer-events-none ml-2 inline-flex h-5 select-none items-center gap-0.5 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                    ⌘K
                </kbd>
            </button>
        );
    }

    return (
        <div className="w-full max-w-md">
            <Command shouldFilter={false} className="rounded-lg border border-border shadow-xl">
                <CommandInput
                    placeholder="Search nodes…"
                    value={query}
                    onValueChange={search}
                    autoFocus
                />
                <CommandList>
                    <CommandEmpty>
                        {query.trim() ? 'No results found.' : 'Type to search…'}
                    </CommandEmpty>
                    {results.length > 0 && (
                        <CommandGroup>
                            {results.map((node) => (
                                <CommandItem
                                    key={node.id}
                                    value={node.id}
                                    onSelect={selectResult}
                                >
                                    <div
                                        className="h-2 w-2 shrink-0 rounded-full"
                                        style={{ backgroundColor: TYPE_COLORS[node.type] ?? '#64748b' }}
                                    />
                                    <span className="flex-1 truncate">{node.label}</span>
                                    <span className="text-xs text-muted-foreground">{node.type}</span>
                                    <Badge size="sm" variant="outline">
                                        {node.weight}
                                    </Badge>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}
                </CommandList>
            </Command>
        </div>
    );
}
