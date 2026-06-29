import { useGraphStore } from '../store/graphStore.js';

export default function ScanProgress() {
    const isScanning = useGraphStore((s) => s.isScanning);
    const scanProgress = useGraphStore((s) => s.scanProgress);

    if (!isScanning) return null;

    return (
        <div className="absolute inset-x-0 top-0 z-20">
            <div className="h-1 w-full bg-muted">
                <div
                    className="h-full bg-primary transition-[width] duration-300 ease-out"
                    style={{ width: `${scanProgress}%` }}
                />
            </div>
        </div>
    );
}
