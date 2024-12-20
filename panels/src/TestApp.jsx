import * as React from "react";
import { useState } from "react";
import Map, { Popup } from "react-map-gl";
// import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN =
  "pk.eyJ1IjoiYWxleGFuZGVyYmFyYWJhc2giLCJhIjoiY20zb3pwaGdzMDkxbzJqc2YwdDN2MWR5dyJ9.J_4x7HLI9jj4Wyr2wGciNA";

function App() {
  const [showPopup, setShowPopup] = useState(true);

  return (
    <Map
      mapboxAccessToken={MAPBOX_TOKEN}
      initialViewState={{
        longitude: -100,
        latitude: 40,
        zoom: 3.5,
      }}
      mapStyle="mapbox://styles/mapbox/streets-v9"
    >
      {showPopup && (
        <Popup
          longitude={-100}
          latitude={40}
          anchor="bottom"
          onClose={() => setShowPopup(false)}
        >
          You are here
        </Popup>
      )}
    </Map>
  );
}

export default App;
