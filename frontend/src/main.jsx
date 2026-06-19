import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./App.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <div className="trackos-bg" />
    <BrowserRouter>
      <App />
    </BrowserRouter>
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: "rgba(20,20,22,0.9)",
          color: "#f4f4f6",
          border: "1px solid rgba(255,159,28,0.25)",
          backdropFilter: "blur(12px)",
        },
      }}
    />
  </React.StrictMode>
);
