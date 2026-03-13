import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Import auth utilities để tự động cleanup invalid auth data
import '@/lib/authUtils';

createRoot(document.getElementById("root")!).render(<App />);
