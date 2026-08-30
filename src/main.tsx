import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import App, { createAppRouter } from "./App";
import { ThemeProvider } from "./context/ThemeContext";
import { queryClient } from "@/lib/queryClient";

const router = createAppRouter();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <App router={router} />
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
);
