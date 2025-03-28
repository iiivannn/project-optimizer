import { useEffect, useState, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { signOutUser } from "../../firebase/auth";
import { db } from "../../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import * as polyline from "@mapbox/polyline";
import PlaceAutocomplete from "./AutoComplete";

import "./Dashboard.css";

mapboxgl.accessToken =
  "pk.eyJ1IjoicGhhbnRhenp6bSIsImEiOiJjbTd5Ymt0YWswODk5MmlvZjdxZXR6MmFqIn0.mFbMkTo_2c2nzz3nv-cz7g";

export default function Dashboard() {
  const { currentUser } = useAuth();
  const [username, setUsername] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsername = async () => {
      if (currentUser) {
        try {
          const userDoc = doc(db, "users", currentUser.uid);
          const userSnap = await getDoc(userDoc);
          if (userSnap.exists()) {
            setUsername(userSnap.data().username);
            console.log(
              "User ID:" +
                currentUser.uid +
                " Username:" +
                userSnap.data().username
            );
          }
        } catch (error) {
          console.error("Error fetching username:", error);
        }
      }
    };

    fetchUsername();
  }, [currentUser]);

  useEffect(() => {
    if (mapContainer.current && !map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v11",
        center: [120.9842, 14.5995],
        zoom: 10,
      });
    }
  }, []);

  const handleLogout = async () => {
    await signOutUser();
    navigate("/login");
  };

  const updateMap = async () => {
    if (!from || !to) return;

    try {
      const getCoordinates = async (place) => {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            place
          )}.json?access_token=${mapboxgl.accessToken}`
        );
        const data = await response.json();
        return data.features[0]?.center || null;
      };

      const fromCoords = await getCoordinates(from);
      const toCoords = await getCoordinates(to);

      if (fromCoords && toCoords) {
        // Detailed logging
        console.log("From Coordinates:", fromCoords);
        console.log("To Coordinates:", toCoords);

        // Remove existing markers and routes
        markersRef.current.forEach((marker) => marker.remove());
        markersRef.current = [];

        // Remove existing route if it exists
        if (map.current.getSource("route")) {
          map.current.removeLayer("route");
          map.current.removeSource("route");
        }

        // Fit map to bounds of both points
        const bounds = new mapboxgl.LngLatBounds();
        bounds.extend(fromCoords);
        bounds.extend(toCoords);
        map.current.fitBounds(bounds, {
          padding: 100,
          duration: 1000,
        });

        // Create markers
        const fromMarker = new mapboxgl.Marker()
          .setLngLat(fromCoords)
          .addTo(map.current);

        const toMarker = new mapboxgl.Marker({ color: "red" })
          .setLngLat(toCoords)
          .addTo(map.current);

        markersRef.current.push(fromMarker, toMarker);

        // Fetch route from Mapbox Directions API
        const response = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${fromCoords[0]},${fromCoords[1]};${toCoords[0]},${toCoords[1]}?access_token=${mapboxgl.accessToken}`
        );
        const routeData = await response.json();

        // Detailed logging of route data
        console.log("Full Route Response:", routeData);
        console.log("Routes:", routeData.routes);

        // Add route to the map
        if (routeData.routes && routeData.routes.length > 0) {
          const route = routeData.routes[0];

          // More detailed logging
          console.log("Route Geometry:", route.geometry);
          const decodedCoordinates = polyline.decode(route.geometry);
          console.log("Decoded Coordinates:", decodedCoordinates);

          // Add route source to the map
          map.current.addSource("route", {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry: {
                type: "LineString",
                // Swap the order of each coordinate pair
                coordinates: decodedCoordinates.map((coord) => [
                  coord[1],
                  coord[0],
                ]),
              },
            },
          });

          // Add route layer
          map.current.addLayer({
            id: "route",
            type: "line",
            source: "route",
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
            paint: {
              "line-color": "red",
              "line-width": 6,
              "line-opacity": 0.9,
            },
          });
        } else {
          console.error("No routes found");
        }
      }
    } catch (error) {
      console.error("Error fetching route:", error);
    }
  };

  const resetMap = () => {
    setFrom("");
    setTo("");

    // Remove markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Remove route if it exists
    if (map.current.getSource("route")) {
      map.current.removeLayer("route");
      map.current.removeSource("route");
    }

    if (map.current) {
      map.current.flyTo({ center: [120.9842, 14.5995], zoom: 10 });
    }
  };
  return (
    <div>
      <div className="nav">
        <h1>RouteWise</h1>
        <button className="logout-btn" type="button" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <p className="welcome-user">
        Welcome, {username ? username : currentUser?.email}!
      </p>
      <div className="content-container">
        <div className="content">
          <div className="go-from">
            <div className="search">
              <label htmlFor="search-from">From:</label>
              <PlaceAutocomplete
                accessToken={mapboxgl.accessToken}
                value={from}
                onChange={setFrom}
                placeholder="Enter starting location"
              />
            </div>
          </div>

          <div className="go-to">
            <div className="search">
              <label htmlFor="search-to">To:</label>
              <PlaceAutocomplete
                accessToken={mapboxgl.accessToken}
                value={to}
                onChange={setTo}
                placeholder="Enter destination"
              />
            </div>
          </div>

          <div className="buttons-container">
            <div className="buttons">
              <button className="search-btn" onClick={updateMap}>
                Search
              </button>
              <button className="reset-btn" onClick={resetMap}>
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      <div ref={mapContainer} className="map-container"></div>
    </div>
  );
}
