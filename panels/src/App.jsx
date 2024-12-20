import React, { useState, useEffect, useRef } from "react";
import Map, { Source, Layer } from "react-map-gl";
import mapboxgl from "mapbox-gl";
import noFlyZonesData from "../no-fly-zones.json";

const MAPBOX_TOKEN =
  "pk.eyJ1IjoiYWxleGFuZGVyYmFyYWJhc2giLCJhIjoiY20zb3pwaGdzMDkxbzJqc2YwdDN2MWR5dyJ9.J_4x7HLI9jj4Wyr2wGciNA";

const App = () => {
  const [drones, setDrones] = useState([]);
  const [noFlyZones, setNoFlyZones] = useState([]);
  const [mapStyle, setMapStyle] = useState(
    "mapbox://styles/mapbox/streets-v11"
  );
  const mapRef = useRef(null);

  const handleMapStyleChange = (style) => {
    setMapStyle(style);
  };

  useEffect(() => {
    // Завантаження даних про безпілотні зони з JSON файлу
    setNoFlyZones(noFlyZonesData);
  }, []);

  // Підключення до SSE для отримання даних про дрони
  useEffect(() => {
    const eventSource = new EventSource("http://localhost:3000/api/drones");
    eventSource.onmessage = (event) => {
      const newDroneData = JSON.parse(event.data);
      console.log('newDroneData', newDroneData);

      setDrones((prevDrones) => {
        const updatedDrones = newDroneData;
        return updatedDrones;
      });
    };

    return () => {
      eventSource.close();
    };
  }, []);

  // Функція для обробки кліків по безпілотним зонам
  const handleNoFlyZoneClick = (event) => {
    const map = mapRef.current.getMap();
    const features = map.queryRenderedFeatures(event.point, {
      layers: [
        "no-fly-zone",
        ...drones.map((item) => `drone-layer-${item.droneId}`),
      ],
    });

    if (features && features.length > 0) {
      const lngLat = event.lngLat;

      const feature = features[0];
      console.log("feature", feature);
      console.log("featfeature.sourceure", feature.source);

      if (feature.source.includes("drone")) {
        // Створення попапу
        new mapboxgl.Popup({ offset: 25 })
          .setLngLat(lngLat)
          .setHTML(
            `<div style="padding: 5px;">
            Altitude: ${feature.properties.altitude} 
            <br>
            ID: ${feature.properties.droneId}
            </div>`
          )
          .addTo(map);
      } else {
        new mapboxgl.Popup({ offset: 25 })
          .setLngLat(lngLat)
          .setHTML(
            `<div style="padding: 5px;">
            Height ${feature.properties.height}
            <br>
            Description: ${feature.properties.description}
          </div>`
          )
          .addTo(map);
      }
    }
  };

  return (
    <div style={{ display: "flex" }}>
      <div
        style={{ width: "250px", padding: "10px", backgroundColor: "#f8f8f8" }}
      >
        <h3>Перемикач стилів карти</h3>
        <ul style={{ listStyle: "none", padding: 0 }}>
          <li>
            <button
              onClick={() =>
                handleMapStyleChange("mapbox://styles/mapbox/streets-v11")
              }
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                backgroundColor: "#333",
                color: "#fff",
                padding: "10px",
                border: "none",
                borderRadius: "5px",
                marginBottom: "10px",
              }}
            >
              <img
                src="https://img.icons8.com/ios-filled/50/000000/street-view.png"
                alt="Вулиці"
                style={{ width: "24px", height: "24px" }}
              />
              Вулиці
            </button>
          </li>
          <li>
            <button
              onClick={() =>
                handleMapStyleChange("mapbox://styles/mapbox/satellite-v9")
              }
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                backgroundColor: "#333",
                color: "#fff",
                padding: "10px",
                border: "none",
                borderRadius: "5px",
                marginBottom: "10px",
              }}
            >
              <img
                src="https://img.icons8.com/ios-filled/50/000000/satellite.png"
                alt="Супутник"
                style={{ width: "24px", height: "24px" }}
              />
              Супутник
            </button>
          </li>
          <li>
            <button
              onClick={() =>
                handleMapStyleChange("mapbox://styles/mapbox/outdoors-v11")
              }
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                backgroundColor: "#333",
                color: "#fff",
                padding: "10px",
                border: "none",
                borderRadius: "5px",
                marginBottom: "10px",
              }}
            >
              <img
                src="https://img.icons8.com/ios-filled/50/000000/mountain.png"
                alt="Топографія"
                style={{ width: "24px", height: "24px" }}
              />
              Топографія
            </button>
          </li>
          <li>
            <button
              onClick={() =>
                handleMapStyleChange("mapbox://styles/mapbox/light-v10")
              }
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                backgroundColor: "#333",
                color: "#fff",
                padding: "10px",
                border: "none",
                borderRadius: "5px",
                marginBottom: "10px",
              }}
            >
              <img
                src="https://img.icons8.com/ios-filled/50/000000/light-on.png"
                alt="Легка тема"
                style={{ width: "24px", height: "24px" }}
              />
              Легка тема
            </button>
          </li>
          <li>
            <button
              onClick={() =>
                handleMapStyleChange("mapbox://styles/mapbox/dark-v10")
              }
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                backgroundColor: "#333",
                color: "#fff",
                padding: "10px",
                border: "none",
                borderRadius: "5px",
              }}
            >
              <img
                src="https://img.icons8.com/ios-filled/50/000000/moon.png"
                alt="Темна тема"
                style={{ width: "24px", height: "24px" }}
              />
              Темна тема
            </button>
          </li>
        </ul>
      </div>

      <Map
        ref={mapRef}
        initialViewState={{
          longitude: 30.5234,
          latitude: 50.4501,
          zoom: 12,
          pitch: 45,
          bearing: 0,
        }}
        style={{ width: "calc(100vw - 250px)", height: "100vh" }}
        mapStyle={mapStyle}
        mapboxAccessToken={MAPBOX_TOKEN}
        interactiveLayerIds={["no-fly-zone"]}
        onClick={handleNoFlyZoneClick}
      >
        <Source
          key={`no-fly-zone`}
          id={`no-fly-zones`}
          type="geojson"
          data={noFlyZones}
        >
          <Layer
            id={`no-fly-zone`}
            type="fill-extrusion"
            paint={{
              "fill-extrusion-color": "#6436BA",
              "fill-extrusion-height": ["get", "height"],
              "fill-extrusion-opacity": 0.5,
            }}
          />
        </Source>

        {/* Дрони */}
        {drones.map((drone) => {
          return (
            <Source
              key={drone.droneId}
              id={`drone-${drone.droneId}`}
              type="geojson"
              data={{
                type: "Feature",
                geometry: {
                  type: "Point",
                  coordinates: [drone.longitude, drone.latitude],
                },
                properties: {
                  altitude: drone.altitude,
                  droneId: drone.droneId,
                },
              }}
            >
              <Layer
                id={`drone-layer-${drone.droneId}`}
                type="circle"
                paint={{
                  //"circle-color": "#0000ff",
                  "circle-color": drone.color,
                  "circle-radius": 6,
                  "circle-opacity": 0.8,
                }}
              />
            </Source>
          );
        })}
      </Map>
    </div>
  );
};

export default App;
