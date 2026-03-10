import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Polyfill for global if needed by some libraries (like Quill)
if (typeof window !== 'undefined' && !(window as any).global) {
    (window as any).global = window;
}

const container = document.getElementById("root");
if (container) {
    const root = createRoot(container);
    root.render(<App />);
}
