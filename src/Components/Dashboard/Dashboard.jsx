/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { signOutUser } from "../../firebase/auth";
import { db } from "../../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import * as polyline from "@mapbox/polyline";
import PlaceAutocomplete from "./PlaceAutocomplete";

import "./Dashboard.css";

mapboxgl.accessToken =
  "pk.eyJ1IjoicGhhbnRhenp6bSIsImEiOiJjbTd5Ymt0YWswODk5MmlvZjdxZXR6MmFqIn0.mFbMkTo_2c2nzz3nv-cz7g";

// Manila coordinates and view settings
const MANILA_COORDINATES = {
  center: [120.9842, 14.5995], // Center coordinates for Manila
  zoom: 11, // Zoom level to show most of Manila
  bounds: [
    [120.9, 14.5], // Southwest coordinates
    [121.1, 14.7], // Northeast coordinates
  ],
};

// Color palette for road segments
const ROAD_COLORS = [
  "#FF5733", // Red-Orange
  "#33A1FF", // Blue
  "#33FF57", // Green
  "#9333FF", // Purple
  "#FF33A1", // Pink
  "#33FFF1", // Cyan
  "#FFD433", // Yellow
  "#7D33FF", // Indigo
  "#FF5733", // Orange
  "#33FFB8", // Teal
];

export default function Dashboard() {
  const { currentUser } = useAuth();
  const [username, setUsername] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef([]);
  const labelsRef = useRef([]);
  const routeLayersRef = useRef([]);
  const navigate = useNavigate();
  const [userLocation, setUserLocation] = useState(null);
  const [roadLandmarks, setRoadLandmarks] = useState([]);
  const [roadSegments, setRoadSegments] = useState([]);
  const [distance, setDistance] = useState(null);
  const [travelTime, setTravelTime] = useState(null);

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
    // Initialize map with Manila view regardless of user location
    if (mapContainer.current && !map.current) {
      initializeMap();
    }

    // Attempt to get user location in background for search proximity bias only
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { longitude, latitude } = position.coords;
          setUserLocation({ longitude, latitude });

          // Add a small marker for user's location without changing the map view
          if (map.current) {
            new mapboxgl.Marker({ color: "#0077ff", scale: 0.7 })
              .setLngLat([longitude, latitude])
              .addTo(map.current);
          }
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, []);

  const initializeMap = () => {
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: MANILA_COORDINATES.center,
      zoom: MANILA_COORDINATES.zoom,
    });

    // Add map controls (zoom buttons, etc)
    map.current.addControl(new mapboxgl.NavigationControl(), "bottom-right");

    // Once map loads, fit it to show all of Manila
    map.current.on("load", () => {
      fitMapToManila();
    });
  };

  // Helper function to fit map to Manila bounds
  const fitMapToManila = () => {
    if (map.current) {
      const bounds = new mapboxgl.LngLatBounds(
        MANILA_COORDINATES.bounds[0],
        MANILA_COORDINATES.bounds[1]
      );

      map.current.fitBounds(bounds, {
        padding: { top: 50, bottom: 50, left: 50, right: 50 },
        duration: 1000,
      });
    }
  };

  // Create a road label at the given coordinates
  const createRoadLabel = (roadName, coordinates, color, index) => {
    if (!map.current) return null;

    // Create a popup for the road name
    const popup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      className: "road-label",
    })
      .setLngLat(coordinates)
      .setHTML(
        `
        <div class="road-label-content">
          <div class="road-label-color-indicator" style="background-color: ${color};"></div>
          <div class="road-label-text">${roadName}</div>
        </div>
      `
      )
      .addTo(map.current);

    return popup;
  };

  const handleLogout = async () => {
    await signOutUser();
    navigate("/login");
  };

  const formatDistance = (meters) => {
    if (meters < 1000) {
      return `${meters.toFixed(0)} m`;
    } else {
      return `${(meters / 1000).toFixed(2)} km`;
    }
  };

  const formatDuration = (seconds) => {
    if (seconds < 60) {
      return `${seconds.toFixed(0)} seconds`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.floor(seconds % 60);
      return `${minutes} min ${
        remainingSeconds > 0 ? remainingSeconds + " sec" : ""
      }`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours} hr ${minutes > 0 ? minutes + " min" : ""}`;
    }
  };

  const updateMap = async () => {
    if (!from || !to) return;

    try {
      const getCoordinates = async (place) => {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            place
          )}.json?access_token=${mapboxgl.accessToken}&country=ph`
        );
        const data = await response.json();
        return data.features[0]?.center || null;
      };

      const fromCoords = await getCoordinates(from);
      const toCoords = await getCoordinates(to);

      if (fromCoords && toCoords) {
        // Clear previous map elements
        resetMapElements();

        // Fit map to bounds of both points
        const bounds = new mapboxgl.LngLatBounds();
        bounds.extend(fromCoords);
        bounds.extend(toCoords);
        map.current.fitBounds(bounds, {
          padding: 100,
          duration: 1000,
        });

        // Create markers
        const fromMarker = new mapboxgl.Marker({ color: "#4285F4" })
          .setLngLat(fromCoords)
          .setPopup(
            new mapboxgl.Popup().setHTML(`<strong>Start:</strong> ${from}`)
          )
          .addTo(map.current);

        const toMarker = new mapboxgl.Marker({ color: "#EA4335" })
          .setLngLat(toCoords)
          .setPopup(new mapboxgl.Popup().setHTML(`<strong>End:</strong> ${to}`))
          .addTo(map.current);

        markersRef.current.push(fromMarker, toMarker);

        // Fetch route from Mapbox Directions API with steps included
        const response = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${fromCoords[0]},${fromCoords[1]};${toCoords[0]},${toCoords[1]}?steps=true&geometries=polyline&overview=full&annotations=distance&access_token=${mapboxgl.accessToken}`
        );
        const routeData = await response.json();

        if (routeData.routes && routeData.routes.length > 0) {
          const route = routeData.routes[0];

          // Extract and set distance and duration information
          const distanceInMeters = route.distance;
          const durationInSeconds = route.duration;
          setDistance(formatDistance(distanceInMeters));
          setTravelTime(formatDuration(durationInSeconds));

          // Process road segments
          const segments = [];
          const uniqueRoads = new Set();

          if (route.legs && route.legs.length > 0) {
            route.legs.forEach((leg) => {
              if (leg.steps && leg.steps.length > 0) {
                leg.steps.forEach((step) => {
                  if (step.name && step.name !== "") {
                    // Decode each step's geometry
                    const coords = polyline
                      .decode(step.geometry)
                      .map((coord) => [coord[1], coord[0]]);

                    if (coords.length > 0) {
                      segments.push({
                        name: step.name,
                        coordinates: coords,
                        distance: step.distance,
                        duration: step.duration,
                      });

                      uniqueRoads.add(step.name);
                    }
                  }
                });
              }
            });
          }

          setRoadSegments(segments);
          setRoadLandmarks(Array.from(uniqueRoads));

          // Draw each road segment with unique color
          segments.forEach((segment, index) => {
            const colorIndex = index % ROAD_COLORS.length;
            const color = ROAD_COLORS[colorIndex];

            // Add source and layer for this road segment
            const sourceId = `route-segment-${index}`;
            const layerId = `route-layer-${index}`;

            map.current.addSource(sourceId, {
              type: "geojson",
              data: {
                type: "Feature",
                properties: {
                  name: segment.name,
                  distance: segment.distance,
                  duration: segment.duration,
                },
                geometry: {
                  type: "LineString",
                  coordinates: segment.coordinates,
                },
              },
            });

            map.current.addLayer({
              id: layerId,
              type: "line",
              source: sourceId,
              layout: {
                "line-join": "round",
                "line-cap": "round",
              },
              paint: {
                "line-color": color,
                "line-width": 6,
                "line-opacity": 0.8,
              },
            });

            routeLayersRef.current.push({ sourceId, layerId });

            // Add label at the midpoint of the segment
            if (segment.coordinates.length > 1) {
              const midpointIndex = Math.floor(segment.coordinates.length / 2);
              const labelPosition = segment.coordinates[midpointIndex];
              const label = createRoadLabel(
                segment.name,
                labelPosition,
                color,
                index
              );
              if (label) labelsRef.current.push(label);
            }

            // Make segment interactive
            map.current.on("mouseenter", layerId, () => {
              map.current.getCanvas().style.cursor = "pointer";
              map.current.setPaintProperty(layerId, "line-width", 10);
            });

            map.current.on("mouseleave", layerId, () => {
              map.current.getCanvas().style.cursor = "";
              map.current.setPaintProperty(layerId, "line-width", 6);
            });
          });
        } else {
          console.error("No routes found");
          resetStateData();
        }
      }
    } catch (error) {
      console.error("Error fetching route:", error);
      resetStateData();
    }
  };

  const resetStateData = () => {
    setDistance(null);
    setTravelTime(null);
    setRoadLandmarks([]);
    setRoadSegments([]);
  };

  const resetMapElements = () => {
    // Remove existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Remove existing labels
    labelsRef.current.forEach((label) => label.remove());
    labelsRef.current = [];

    // Remove existing route layers and sources
    routeLayersRef.current.forEach(({ layerId, sourceId }) => {
      if (map.current.getLayer(layerId)) {
        map.current.removeLayer(layerId);
      }
      if (map.current.getSource(sourceId)) {
        map.current.removeSource(sourceId);
      }
    });
    routeLayersRef.current = [];
  };

  const resetMap = () => {
    setFrom("");
    setTo("");
    resetStateData();
    resetMapElements();
    fitMapToManila();
  };

  return (
    <div className="dashboard-container">
      <div className="nav">
        <h1>PUBTRO</h1>
        <button className="logout-btn" type="button" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div className="content-container">
        <div className="content">
          <p className="welcome-user">
            Welcome, {username ? username : currentUser?.email}!
          </p>
          <div className="go-from">
            <div className="search">
              <label htmlFor="search-from">From:</label>
              <PlaceAutocomplete
                accessToken={mapboxgl.accessToken}
                value={from}
                onChange={setFrom}
                placeholder="Enter starting location"
                userLocation={userLocation}
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
                userLocation={userLocation}
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

      <div className="features">
        <div className="landmarks">
          <h2>Route Roads</h2>
          {roadLandmarks.length > 0 ? (
            <div className="landmarks-list">
              <ul className="road-list">
                {roadSegments.map((segment, index) => (
                  <li key={index} className="road-item">
                    <div
                      className="road-color-indicator"
                      style={{
                        backgroundColor:
                          ROAD_COLORS[index % ROAD_COLORS.length],
                      }}
                    ></div>
                    <div className="road-details">
                      <span className="road-name">{segment.name}</span>
                      <span className="road-distance">
                        {formatDistance(segment.distance)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="no-route">No route selected</p>
          )}
        </div>
        <div className="kilometers">
          <h2>Journey Details</h2>
          {distance ? (
            <div className="journey-details">
              <div className="detail-item">
                <span className="detail-label">Total Distance:</span>
                <span className="detail-value">{distance}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Estimated Time:</span>
                <span className="detail-value">{travelTime}</span>
              </div>
            </div>
          ) : (
            <p className="no-route">No route selected</p>
          )}
        </div>
      </div>
    </div>
  );
}
