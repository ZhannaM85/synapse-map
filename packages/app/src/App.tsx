import GraphCanvas from './components/GraphCanvas.js';
import NodeDetail from './components/NodeDetail.js';
import SearchBar from './components/SearchBar.js';

export default function App() {
    return (
        <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
            <div className="relative flex-1">
                <div className="absolute inset-x-0 top-4 z-10 flex justify-center px-4">
                    <SearchBar />
                </div>
                <GraphCanvas />
            </div>
            <NodeDetail />
        </div>
    );
}
