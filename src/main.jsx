import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import KarateLife from "./KarateLife.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode><KarateLife /></StrictMode>
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(error => {
      console.warn("KARATÉ LIFE : installation hors ligne indisponible", error);
    });
  });
}
