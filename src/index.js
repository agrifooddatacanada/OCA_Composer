import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import "./i18n";

// Fix ResizeObserver loop errors by implementing proper debouncing
// This prevents the "ResizeObserver loop completed with undelivered notifications" error
if (typeof window !== "undefined") {
  // Store original ResizeObserver
  const OriginalResizeObserver = window.ResizeObserver;
  
  // Debounce function to batch resize observations
  const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // Create a debounced ResizeObserver that batches observations
  window.ResizeObserver = class DebouncedResizeObserver extends OriginalResizeObserver {
    constructor(callback) {
      // Debounce the callback to prevent rapid successive calls
      const debouncedCallback = debounce(callback, 16); // ~60fps
      
      super((entries, observer) => {
        try {
          // Only call the callback if we have valid entries
          if (entries && entries.length > 0) {
            debouncedCallback(entries, observer);
          }
        } catch (error) {
          // Log non-ResizeObserver errors for debugging
          if (!error.message || !error.message.includes("ResizeObserver")) {
            console.error("ResizeObserver error:", error);
          }
        }
      });
    }
  };
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
