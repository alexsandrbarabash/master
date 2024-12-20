import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// import "./index.css";
import 'mapbox-gl/dist/mapbox-gl.css';


import App from './App.jsx'
// import App from "./TestApp.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
