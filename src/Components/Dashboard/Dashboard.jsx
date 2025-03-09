import { useEffect, useState, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { signOutUser } from "../../firebase/auth";
import { db } from "../../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import mapboxgl from "mapbox-gl";

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
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsername = async () => {
      if (currentUser) {
        try {
          const userDoc = doc(db, "users", currentUser.uid);
          const userSnap = await getDoc(userDoc);
          if (userSnap.exists()) {
            setUsername(userSnap.data().username);
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
        map.current.flyTo({ center: fromCoords, zoom: 12 });

        new mapboxgl.Marker().setLngLat(fromCoords).addTo(map.current);
        new mapboxgl.Marker({ color: "red" }).setLngLat(toCoords).addTo(map.current);
      }
    } catch (error) {
      console.error("Error fetching coordinates:", error);
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

      <div className="content">
        <div className="go-from">
          <div className="search">
            <label htmlFor="search-from">From:</label>
            <input
              type="text"
              name="search-from"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
        </div>
<div> This is a trial </div>
        <div className="go-to">
          <div className="search">
            <label htmlFor="search-to">To:</label>
            <input
              type="text"
              name="search-to"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
        </div>

        <button className="search-btn" onClick={updateMap}>Search</button>
      </div>

      <div ref={mapContainer} className="map-container"></div>
    </div>
  );
}