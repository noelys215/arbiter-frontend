import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import AppProviders from "./app/providers";
import { Analytics } from "@vercel/analytics/next";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProviders>
      <Analytics />
      <App />
    </AppProviders>
  </StrictMode>,
);
